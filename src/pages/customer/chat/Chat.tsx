// src/customer/chat/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Input, List, Avatar, Typography } from "antd";
import { connectWebSocket, sendChatMessage, getLocalUser } from "../../../config/websocketConfig";

const { TextArea } = Input;
const { Text } = Typography;

export default function Chat() {
  const [client, setClient] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const wsClient = connectWebSocket((payload) => {
      if (payload.type === "CONNECTED") {
        setConnected(true);
        return;
      }
      if (payload.type === "DISCONNECTED") {
        setConnected(false);
        return;
      }

      setMessages((prev) => [...prev, payload]);
    });

    setClient(wsClient);

    return () => wsClient?.deactivate();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const user = getLocalUser();

    const payload = {
      senderId: user?.accountId || user?.userId,
      fullName: user?.fullName,
      messageContent: text,
      conversationId: null, // 1 customer = 1 conversation
      isCustomer: true,
    };

    sendChatMessage(client, payload);

    setMessages((prev) => [...prev, { ...payload, self: true }]);
    setText("");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
        <Text strong>Hỗ trợ khách hàng</Text>
        <span style={{ float: "right" }}>
          {connected ? <Text type="success">Online</Text> : <Text type="danger">Offline</Text>}
        </span>
      </div>

      {/* Messages */}
      <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
        <List
          dataSource={messages}
          renderItem={(m, i) => (
            <List.Item key={i} style={{ justifyContent: m.self ? "flex-end" : "flex-start" }}>
              <List.Item.Meta
                avatar={<Avatar>{(m.fullName || "U")[0]}</Avatar>}
                title={m.fullName}
                description={m.messageContent}
              />
            </List.Item>
          )}
        />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 10, borderTop: "1px solid #ddd" }}>
        <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="primary" disabled={!text.trim()} onClick={send} style={{ marginTop: 10, float: "right" }}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
