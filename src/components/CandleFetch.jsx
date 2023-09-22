import { useEffect, useState } from "react"
import CandleStickChart from "./TryChart";

export const CandleFetch = () => {
    const [uiState, setUIState] = useState([]);
    useEffect(() => {
        const w = new WebSocket('wss://api-pub.bitfinex.com/ws/2')

        w.addEventListener('message', (msg) => {
            msg = JSON.parse(msg.data);

            if (msg.event) return

            const copyUIState = [...uiState];
            const data = msg[1];

            if (typeof data === 'string') {
                return;
            }

            const result = data?.map(d => {
                return {
                    date: new Date(d[0]),
                    open: +d[1],
                    close: +d[2],
                    high: +d[3],
                    low: +d[4],
                    volume: +d[5],
                    absoluteChange: "",
                    dividend: "",
                    percentChange: "",
                    split: "",
                }
            })

            result.sort((a, b) => a.date - b.date);

            setUIState([
                ...result
            ])
        })
        
        let msg = JSON.stringify({ 
          event: 'subscribe', 
          channel: 'candles', 
          key: 'book:30m:tBTCUSD' //'trade:TIMEFRAME:SYMBOL'
        })
        
        w.addEventListener('open', () => w.send(msg))
    }, []);

    return (
        <>
            <p>Websocket trial</p>
            {
                uiState.length > 0 && <CandleStickChart data={uiState} />
            }
        </>
    )
}