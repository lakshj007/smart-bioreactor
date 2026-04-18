import { useEffect, useRef, useState } from "react";
import type { ReactorState } from "./types";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";

const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws`;

type Page = "home" | "dashboard";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [state, setState] = useState<ReactorState | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ReactorState;
          setState(data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (shouldReconnect.current) {
          reconnectTimer.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {page === "home" ? (
        <HomePage
          connected={connected}
          state={state}
          onEnter={() => setPage("dashboard")}
        />
      ) : (
        <Dashboard
          state={state}
          connected={connected}
          onBack={() => setPage("home")}
        />
      )}
    </div>
  );
}

export default App;
