// Chat.tsx (replace your current file with this)
// Note: path where you save must match your import in ManageChat.tsx

import { useEffect, useRef, useState } from "react";
import { Button, Input, Avatar, Typography, message as antdMessage, Tooltip } from "antd";
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
  isCustomer?: boolean;
  timestamp: number;
};

type Props = {
  conversationId?: string | null;
  customerName?: string; // <-- ADDED: allow ManageChat to pass name
};

// ==========================
// HELPERS: format relative time (Vietnamese), full time, grouping
// ==========================
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatFullTimestamp(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
}

function relativeVietnamese(ts: number) {
  const now = Date.now();
  const diffSec = Math.floor((now - ts) / 1000);

  if (diffSec < 10) return "vừa xong";
  if (diffSec < 60) return "vừa xong";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return m === 1 ? "1 phút trước" : `${m} phút trước`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return h === 1 ? "1 giờ trước" : `${h} giờ trước`;
  }
  if (diffSec < 172800) return "Hôm qua";
  if (diffSec < 604800) {
    const d = Math.floor(diffSec / 86400);
    return d === 1 ? "1 ngày trước" : `${d} ngày trước`;
  }
  // older than a week -> show date
  const dt = new Date(ts);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

function getDateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // YYYY-MM-DD
}

function dateHeaderLabel(key: string) {
  const [y, m, d] = key.split("-").map((s) => Number(s));
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (
    dt.getFullYear() === today.getFullYear() &&
    dt.getMonth() === today.getMonth() &&
    dt.getDate() === today.getDate()
  ) {
    return "Hôm nay";
  }

  if (
    dt.getFullYear() === yesterday.getFullYear() &&
    dt.getMonth() === yesterday.getMonth() &&
    dt.getDate() === yesterday.getDate()
  ) {
    return "Hôm qua";
  }

  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

// ==========================
// COMPONENT
// ==========================
export default function Chat({ conversationId: propConversationId, customerName }: Props) {
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

  // Sync prop -> local state (supports ManageChat passing conversationId)
  useEffect(() => {
    if (propConversationId) setConversationId(propConversationId);
  }, [propConversationId]);

  // CUSTOMER auto create conversation if none (for customer-side chat)
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

  // Load messages from firebase
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

  // Auto scroll if user at bottom
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

  // Group messages by day (key = YYYY-MM-DD)
  const grouped: Record<string, Message[]> = {};
  messages.forEach((m) => {
    const key = getDateKey(m.timestamp);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header: show customerName if provided */}
      <div style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
        <Text strong>{customerName || "Hỗ trợ khách hàng"}</Text>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          padding: 10,
          overflowY: "auto",
          flex: 1,
          scrollBehavior: "smooth",
          background: "#f7f9fb",
        }}
      >
        {sortedKeys.map((key) => (
          <div key={key} style={{ marginBottom: 12 }}>
            {/* Day header */}
            <div style={{ textAlign: "center", margin: "12px 0", color: "#666", fontSize: 13 }}>
              <span
                style={{
                  background: "#eef3fb",
                  padding: "6px 12px",
                  borderRadius: 20,
                  display: "inline-block",
                }}
              >
                {dateHeaderLabel(key)}
              </span>
            </div>

            {/* messages of that day */}
            {grouped[key].map((m) => {
              const isMine = m.senderId === user?.accountId;
              const rel = relativeVietnamese(m.timestamp);
              const full = formatFullTimestamp(m.timestamp);

              return (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    {!isMine && <Avatar>{m.fullName[0] || "U"}</Avatar>}

                    <Tooltip title={full} placement={isMine ? "left" : "right"}>
                      <div
                        style={{
                          maxWidth: "68%",
                          background: isMine ? "#1890ff" : "#ffffff",
                          color: isMine ? "white" : "rgba(0,0,0,0.85)",
                          padding: "10px 14px",
                          borderRadius: 18,
                          borderBottomRightRadius: isMine ? 6 : 18,
                          borderBottomLeftRadius: isMine ? 18 : 6,
                          boxShadow: isMine ? "0 6px 18px rgba(24,144,255,0.12)" : "0 4px 12px rgba(16,24,40,0.04)",
                          wordBreak: "break-word",
                        }}
                      >
                        {!isMine && (
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#333" }}>
                            {m.fullName}
                          </div>
                        )}

                        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.45" }}>{m.messageContent}</div>
                      </div>
                    </Tooltip>

                    {isMine && <Avatar style={{ backgroundColor: "#1890ff" }}>{m.fullName[0] || "U"}</Avatar>}
                  </div>

                  {/* Relative time under bubble */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      marginTop: 6,
                      textAlign: isMine ? "right" : "left",
                      marginLeft: isMine ? 0 : 44,
                      marginRight: isMine ? 44 : 0,
                    }}
                  >
                    {rel}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 10, borderTop: "1px solid #ddd", background: "#fff" }}>
        <TextArea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={(e) => {
            e.preventDefault();
            send();
          }}
          placeholder="Nhập tin nhắn..."
        />

        <Button type="primary" disabled={!text.trim()} onClick={send} style={{ marginTop: 10, float: "right" }}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
