// src/config/websocketConfig.ts
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

export type StompClient = Client | null;
const WS_URL = "http://47.128.217.142:9090/api/ws-chat";

export function getLocalUser() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);

    const root = localStorage.getItem("persist:root");
    if (root) return JSON.parse(JSON.parse(root).user);
  } catch {}
  return null;
}

export function connectWebSocket(onMessage: (payload: any) => void): StompClient {
  const user = getLocalUser();

  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    onConnect: () => {
      console.log("Connected!");
      onMessage({ type: "CONNECTED" });

      client.subscribe(`/user/${user.email}/queue/messages`, (frame) => {
        let body = frame.body;
        try {
          body = JSON.parse(body);
        } catch {}

        onMessage(body);
      });
    },
    onDisconnect: () => {
      onMessage({ type: "DISCONNECTED" });
    },
  });

  client.activate();
  return client;
}

export function sendChatMessage(client: Client | null, payload: any) {
  if (!client || !client.active) return;

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
  });
}
