import { useEffect, useState } from 'react';
import './App.css'
import * as _ from 'lodash';
import async from 'async'
import moment from 'moment'
import CRC from 'crc-32'
import useDimensions from 'react-use-dimensions'
import CandleStickChartWithAnnotation from './components/Chart';
import CandleStickChart from './components/TryChart';
import { timeParse } from 'd3-time-format';

let BOOK = {};
let seq = null;
let cli;
let closed = false;

const App = () => {
  const [orderBookState, setOrderBookState] = useState([]);
  const [ref, { width, height }] = useDimensions()        
  useEffect(() => {
    const w = new WebSocket('wss://api-pub.bitfinex.com/ws/2')
    BOOK.bids = {}
    BOOK.asks = {}
    BOOK.psnap = {}
    BOOK.mcnt = 0

    w.addEventListener('message', (msg) => {
      if (!closed) {
        msg = JSON.parse(msg.data);

        if (msg.event) return

        console.log(msg);
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
              const price = bids_keys[i]
              const pp = BOOK.bids[price]
              csdata.push(pp.price, pp.amount)
            }
            if (asks_keys[i]) {
              const price = asks_keys[i]
              const pp = BOOK.asks[price]
              csdata.push(pp.price, -pp.amount)
            }
          }

          const cs_str = csdata.join(':')
          const cs_calc = CRC.str(cs_str)

          if (cs_calc !== checksum) {
            console.error('CHECKSUM_FAILED')
            // process.exit(-1)
            throw new Error("CHECKSUM_FAILED");
          }
          return
        }

        if (BOOK.mcnt === 0) {
          _.each(msg[1], function (pp) {
            pp = { price: pp[0], cnt: pp[1], amount: pp[2], timeStamp: msg[3] }
            const side = pp.amount >= 0 ? 'bids' : 'asks'
            pp.amount = Math.abs(pp.amount)
            BOOK[side][pp.price] = pp
          })
        } else {
          let timestamp = msg[3];
          if (msg[2]) {
            const cseq = +msg[2]
            msg = msg[1]

            if (!seq) {
              seq = cseq - 1
            }

            if (cseq - seq !== 1) {
              console.error('OUT OF SEQUENCE', seq, cseq)
              // process.exit()
            }

            seq = cseq
          }

          let pp = { price: msg[0], cnt: msg[1], amount: msg[2], timeStamp: timestamp }

          if (!pp.cnt) {
            if (pp.amount > 0) {
              if (BOOK['bids'][pp.id]) {
                delete BOOK['bids'][pp.id]
              }
            } else if (pp.amount < 0) {
              if (BOOK['asks'][pp.id]) {
                delete BOOK['asks'][pp.id]
              }
            }
          } else {
            let side = pp.amount >= 0 ? 'bids' : 'asks'
            pp.amount = Math.abs(pp.amount)
            BOOK[side][pp.price] = pp
          }
        }
        _.each(['bids', 'asks'], function(side) {
          let sbook = BOOK[side]
          let bentries = Object.keys(sbook)
    
          bentries.sort(function(a, b) {
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

        let finalChartData = [];
        _.each(['bids', 'asks'], function(side) {
          let sbook = BOOK[side];
          let bentries = Object.keys(sbook)
          const intermediateResult = bentries.map((entry, index) => {
            const data = sbook[entry];
            return {
              date: new Date(data.timeStamp),
              open: data.price,
              close: index % 2 === 0 ? data.price + 12: data.price - 12,  
              high: data.price + 1,
              low: data.price - 30,
              absoluteChange: "",
              dividend: "",
              percentChange: "",
              split: "",
              volume: data.cnt
            }
          })
          finalChartData = finalChartData.concat(intermediateResult);
          finalChartData.sort((a, b) => a.date - b.date);
          setOrderBookState(finalChartData)
        })

        BOOK.mcnt++
        if (BOOK.mcnt === 100) {
          w.addEventListener('close', () => {
            console.log('ws closed');
            closed = true;
          })
          w.removeEventListener('message', () => {

          });
          w.close(1000, "Disconnection");
        }
      }
    })

    let msg = JSON.stringify({
      event: 'subscribe',
      channel: 'book',
      symbol: 'tBTCUSD',
      len: 25,
      freq: "F1"
    })

    w.addEventListener('open', () => {
      w.send(JSON.stringify({ event: 'conf', flags: 65536 + 131072 + 32768 }))
      w.send(msg)
    })
  }, []);

  return (
    <>
      <p>Websocket trial</p>
      <div ref={ref} style={{ width: '100%', height: '100%' }}> 
        {orderBookState.length > 0 && <CandleStickChart data={orderBookState} />}
      </div>
    </>
  )
};

export default App
