import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onError?: (event: Event) => void;
  onClose?: () => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  readyState: number;
  sendMessage: (message: string) => void;
  closeConnection: () => void;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onError,
  onClose,
  reconnectDelay = 2000,
  maxReconnectAttempts = Infinity
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const readyStateRef = useRef<number>(WebSocket.CLOSED);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      wsRef.current = new WebSocket(url);
      readyStateRef.current = WebSocket.CONNECTING;

      wsRef.current.onopen = () => {
        readyStateRef.current = WebSocket.OPEN;
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        onMessage?.(event);
      };

      wsRef.current.onerror = (event) => {
        readyStateRef.current = WebSocket.CLOSED;
        onError?.(event);
      };

      wsRef.current.onclose = () => {
        readyStateRef.current = WebSocket.CLOSED;
        onClose?.();
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      readyStateRef.current = WebSocket.CLOSED;
    }
  }, [url, onMessage, onOpen, onError, onClose, reconnectDelay, maxReconnectAttempts]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not open. Cannot send message:', message);
    }
  }, []);

  const closeConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnection
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    readyStateRef.current = WebSocket.CLOSED;
  }, [maxReconnectAttempts]);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      closeConnection();
    };
  }, [connect, closeConnection]);

  // Cleanup on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      closeConnection();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [closeConnection]);

  return {
    readyState: readyStateRef.current,
    sendMessage,
    closeConnection
  };
} 