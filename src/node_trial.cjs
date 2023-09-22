/*USAGE:
npm install ws lodash async moment crc-32
mkdir logs
node bfx_test_book.js BTCUSD
*/

const WS = require('ws')
const _ = require('lodash')
const async = require('async')
const fs = require('fs')
const moment = require('moment')
const CRC = require('crc-32')

const pair = process.argv[2]

const conf = {
  wshost: "wss://api.bitfinex.com/ws/2"
}

const logfile = __dirname + '/logs/ws-book-raw.log'

const BOOK = {}

let connected = false
let connecting = false
let cli
let seq = null

function connect() {
  if (connecting || connected) return
  connecting = true

  cli = new WS(conf.wshost, { /*rejectUnauthorized: false*/ })
   
  cli.on('open', function open() {
    console.log('WS open')
    connecting = false
    connected = true
    BOOK.bids = {}
    BOOK.asks = {}
    BOOK.psnap = {}
    BOOK.mcnt = 0
    cli.send(JSON.stringify({ event: 'conf', flags: 65536 + 131072 }))
    cli.send(JSON.stringify({ event: "subscribe", channel: "book", pair: pair, prec: "R0", len: 25 }))
  })

  cli.on('close', function open() {
    seq = null
    console.log('WS close')
    connecting = false
    connected = false
  })

  cli.on('message', function(msg) {
    msg = JSON.parse(msg)

    if (msg.event) return
    if (msg[1] === 'hb') {
      seq = +msg[2]
      return
    } else if (msg[1] === 'cs') {
      seq = +msg[3]

      const checksum = msg[2]
      const csdata = []
      const bids_keys = BOOK.psnap['bids']
      const asks_keys = BOOK.psnap['asks']

      for (let i = 0; i < 25; i++) {
        if (bids_keys[i]) {
          const eid = bids_keys[i]
          const pp = BOOK.bids[eid]
          csdata.push(pp.id, pp.amount)
        }
        if (asks_keys[i]) {
          const eid = asks_keys[i]
          const pp = BOOK.asks[eid]
          csdata.push(pp.id, -pp.amount)
        }
      }
 
      const cs_str = csdata.join(':')
      const cs_calc = CRC.str(cs_str)
   
      fs.appendFileSync(logfile, "[" + moment().format("YYYY-MM-DDTHH:mm:ss.SSS") + "] " + pair + " | " + JSON.stringify(["cs_string=" + cs_str, "cs_calc=" + cs_calc, "server_checksum=" + checksum]) + "\n")
      if (cs_calc !== checksum) {
        console.error("CHECKSUM_FAILED", checksum, cs_calc)
        process.exit(-1)
      }
      return
    }
      
    fs.appendFileSync(logfile, "[" + moment().format("YYYY-MM-DDTHH:mm:ss.SSS") + "] " + pair + " | " + JSON.stringify(msg) + "\n")

    if (BOOK.mcnt === 0) {
      _.each(msg[1], function(pp) {
        pp = { id: pp[0], price: pp[1], amount: pp[2] }
        const side = pp.amount >= 0 ? 'bids' : 'asks'
        pp.amount = Math.abs(pp.amount)
        BOOK[side][pp.id] = pp
      })
    } else {
      const cseq = +msg[2]
      msg = msg[1]
      
      if (!seq) {
        seq = cseq - 1
      }

      if (cseq - seq !== 1) {
        console.error('OUT OF SEQUENCE', seq, cseq)
        process.exit()
      }

      seq = cseq

      const pp = { id: msg[0], price: msg[1], amount: msg[2], ix: msg[3] }
      
      if (!pp.price) {
        let found = true
        if (pp.amount > 0) {
          if (BOOK['bids'][pp.id]) {
            delete BOOK['bids'][pp.id]
          } else {
            found = false
          }
        } else if (pp.amount < 0) {
          if (BOOK['asks'][pp.id]) {
            delete BOOK['asks'][pp.id]
          } else {
            found = false
          }
        }
        if (!found) {
          fs.appendFileSync(logfile, "[" + moment().format() + "] " + pair + " | " + JSON.stringify(pp) + " BOOK_RAW delete fail found\n")
        }

      } else {
        const side = pp.amount >= 0 ? 'bids' : 'asks'
        pp.amount = Math.abs(pp.amount)
        BOOK[side][pp.id] = pp
      }
    }

    _.each(['bids', 'asks'], function(side) {
      let sbook = BOOK[side]
      let bentries = Object.keys(sbook)

      let prices = bentries.sort(function(a, b) {
        if (+sbook[a].price === +sbook[b].price) {
          return a - b
        }
        if (side === 'bids') {
          return +sbook[a].price >= +sbook[b].price ? -1 : 1
        } else {
          return +sbook[a].price <= +sbook[b].price ? -1 : 1
        }
      })

      BOOK.psnap[side] = bentries
    })

    BOOK.mcnt++
  })
}

setInterval(function() {
  if (connected) return
  connect()
}, 3500)

function saveBook() {
  const now = moment.utc().format('YYYYMMDDHHmmss')
  fs.writeFileSync(__dirname + "/logs/tmp-ws-book-raw-" + pair + '-' + now + '.log', JSON.stringify({ bids: BOOK.bids, asks: BOOK.asks}))
}

setInterval(function() {
  saveBook()
}, 30000)