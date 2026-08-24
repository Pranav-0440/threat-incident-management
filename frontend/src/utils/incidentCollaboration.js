import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '../api/client';

const INCIDENT_TOPIC = '/topic/incidents';

function getWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws');
  return `${apiOrigin}/ws-soc`;
}

export function subscribeToIncidentUpdates(token, onUpdate) {
  if (!token) {
    return () => {};
  }

  const client = new Client({
    brokerURL: getWebSocketUrl(),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(INCIDENT_TOPIC, (message) => {
        try {
          onUpdate(JSON.parse(message.body));
        } catch (error) {
          console.error('Failed to parse live incident update:', error);
        }
      });
    },
    onStompError: (frame) => {
      console.error('Live incident collaboration error:', frame.headers?.message || 'broker error');
    },
    onWebSocketError: (error) => {
      console.error('Live incident collaboration connection error:', error);
    },
  });

  client.activate();
  return () => {
    client.deactivate();
  };
}
