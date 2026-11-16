"use client";

import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "./api";
import { LiveMatchState } from "@/types";

export function useMatchSocket(matchId: string, initialData?: LiveMatchState | null) {
  const [data, setData] = useState<LiveMatchState | null>(initialData || null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!matchId) return;

    let retryTimeout: NodeJS.Timeout;

    function connect() {
      try {
        const wsUrl = `${WS_BASE_URL}/ws/matches/${matchId}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && parsed.match_id) {
              setData(parsed);
            }
          } catch (e) {
            // Heartbeat ping/pong text
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto-reconnect after 3 seconds
          retryTimeout = setTimeout(() => {
            connect();
          }, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch (err) {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [matchId]);

  return { data, setData, isConnected };
}
