import React, { useEffect } from 'react';
import { socket } from '../context/socket';

export function SubscribeToChannel({ isConnected }) {
   useEffect(() => {
        socket.emit("subscribe", {
            channel: "book",
            symbol: "tBTCUSD"
        })
   }, []);

   return <p>Subscribed to book channel....</p>
}