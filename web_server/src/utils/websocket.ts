interface WebSocketOptions {
  url: string;
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export function createWebSocketConnection({
  url,
  onMessage,
  onOpen,
  onError,
  onClose
}: WebSocketOptions) {
  let ws: WebSocket | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;

  function connect() {
    if (ws) {
      ws.close();
      ws = null;
    }

    ws = new WebSocket(url);

    ws.onopen = (event) => {
      onOpen?.();
    };

    ws.onmessage = onMessage;

    ws.onerror = (event) => {
      onError?.(event);
    };

    ws.onclose = (event) => {
      onClose?.(event);
      // Attempt to reconnect after 2 seconds
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          connect();
        }, 2000);
      }
    };

    // Clean up on window unload
    const handleBeforeUnload = () => {
      if (ws) {
        ws.close();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }

  function close() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  // Only connect in browser environment
  if (typeof window !== 'undefined') {
    connect();
  }

  return {
    close,
    getWebSocket: () => ws
  };
} 