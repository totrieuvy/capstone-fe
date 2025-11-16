import { useEffect, useRef, useState } from "react";
import { Button, Input, List, Avatar, Typography, message as antdMessage } from "antd";
import { db } from "../../../config/firebase";
import { ref, onValue, push, set } from "firebase/database";
import { getLocalUser } from "../../../config/websocketConfig";

const { TextArea } = Input;
const { Text } = Typography;

// ==========================
// TYPES NGAY TRONG FILE
// ==========================
type Message = {
  id: string;
  senderId: string;
  fullName: string;
  messageContent: string;
  isCustomer: boolean;
  timestamp: number;
};

type Props = {
  conversationId?: string | null;
};

export default function Chat({ conversationId: propConversationId }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const user = getLocalUser();

  // ================================
  // Helper: check user đang ở cuối
  // ================================
  const isUserAtBottom = () => {
    const el = containerRef.current;
    if (!el) return true;

    // khoảng cách 50px được xem là "ở cuối"
    return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  // Sync prop -> local state
  useEffect(() => {
    if (propConversationId) setConversationId(propConversationId);
  }, [propConversationId]);

  // Auto-create conversation cho customer
  useEffect(() => {
    if (conversationId || !user) return;

    const cid = `customer-${user.accountId || user.userId || Date.now()}`;
    const membersRef = ref(db, `chats/${cid}/members`);

    set(membersRef, {
      customerId: user.accountId || user.userId,
      customerName: user.fullName || "Khách",
      createdAt: Date.now(),
    })
      .then(() => setConversationId(cid))
      .catch(() => antdMessage.error("Không tạo được cuộc chat"));
  }, [conversationId, user]);

  // Load messages
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = ref(db, `chats/${conversationId}/messages`);

    const unsub = onValue(messagesRef, (snapshot) => {
      const raw = snapshot.val() || {};

      const list: Message[] = Object.entries(raw).map(([id, value]) => ({
        id,
        ...(value as Omit<Message, "id">),
      }));

      list.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(list);
    });

    return () => unsub();
  }, [conversationId]);

  // ================================
  // Scroll mượt CHỈ khi user đang ở cuối
  // ================================
  useEffect(() => {
    if (isUserAtBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message
  const send = async () => {
    if (!text.trim() || !conversationId) return;

    const payload = {
      senderId: user?.accountId || "unknown",
      fullName: user?.fullName || "Khách",
      messageContent: text.trim(),
      isCustomer: true,
      timestamp: Date.now(),
    };

    try {
      await push(ref(db, `chats/${conversationId}/messages`), payload);
      setText("");
    } catch {
      antdMessage.error("Gửi tin nhắn thất bại");
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
        <Text strong>Hỗ trợ khách hàng</Text>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          padding: 10,
          overflowY: "auto",
          flex: 1,
          scrollBehavior: "smooth",
        }}
      >
        <List
          dataSource={messages}
          renderItem={(m) => (
            <List.Item
              key={m.id}
              style={{
                justifyContent: m.isCustomer ? "flex-end" : "flex-start",
              }}
            >
              <List.Item.Meta
                avatar={<Avatar>{m.fullName[0]}</Avatar>}
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
        <TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} onPressEnter={() => {}} />

        <Button type="primary" disabled={!text.trim()} onClick={send} style={{ marginTop: 10, float: "right" }}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
