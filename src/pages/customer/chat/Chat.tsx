import { useEffect, useRef, useState } from "react";
import { Button, Input, Avatar, Typography, message as antdMessage } from "antd";
import { db } from "../../../config/firebase";
import { ref, onValue, push, set } from "firebase/database";
import { getLocalUser } from "../../../config/websocketConfig";

const { TextArea } = Input;
const { Text } = Typography;

// ==========================
// TYPES
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

  // Kiểm tra user đang ở đáy
  const isUserAtBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  // Sync prop -> local state
  useEffect(() => {
    if (propConversationId) setConversationId(propConversationId);
  }, [propConversationId]);

  // CUSTOMER auto create conversation
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

  // Auto scroll nếu user đang ở đáy
  useEffect(() => {
    if (isUserAtBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Gửi tin nhắn
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
        {messages.map((m) => {
          const isMine = m.senderId === user?.accountId;

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: 12,
              }}
            >
              {!isMine && <Avatar style={{ marginRight: 8 }}>{m.fullName[0]}</Avatar>}

              <div
                style={{
                  maxWidth: "60%",
                  background: isMine ? "#1890ff" : "#f5f5f5",
                  color: isMine ? "white" : "black",
                  padding: "8px 12px",
                  borderRadius: 12,
                  borderBottomRightRadius: isMine ? 0 : 12,
                  borderBottomLeftRadius: isMine ? 12 : 0,
                  wordBreak: "break-word",
                }}
              >
                {!isMine && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{m.fullName}</div>}
                {m.messageContent}
              </div>

              {isMine && <Avatar style={{ marginLeft: 8, backgroundColor: "#1890ff" }}>{m.fullName[0]}</Avatar>}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 10, borderTop: "1px solid #ddd" }}>
        <TextArea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={(e) => {
            e.preventDefault();
            send();
          }}
        />

        <Button type="primary" disabled={!text.trim()} onClick={send} style={{ marginTop: 10, float: "right" }}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
