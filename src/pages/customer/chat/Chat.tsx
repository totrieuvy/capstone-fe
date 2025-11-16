import { useEffect, useRef, useState } from "react";
import { Button, Input, Avatar, Typography, Tooltip } from "antd";
import { db } from "../../../config/firebase";
import { ref, onValue, push, set } from "firebase/database";

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
  timestamp: number;
};

type Props = {
  conversationId?: string | null;
  customerName?: string; // only staff uses this
};

// ==========================
// TIME HELPERS
// ==========================
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function relativeVN(ts: number) {
  const now = Date.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 10) return "vừa xong";
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return `${pad(new Date(ts).getDate())}/${pad(new Date(ts).getMonth() + 1)}/${new Date(ts).getFullYear()}`;
}

const fullTime = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
};

const groupKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const groupLabel = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (dt.toDateString() === now.toDateString()) return "Hôm nay";
  if (dt.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return `${d}/${m}/${y}`;
};

// ==============================================================
//                    MAIN CHAT COMPONENT
// ==============================================================
export default function Chat({ conversationId: propConversationId, customerName }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // User lấy từ localStorage (KHÔNG cần websocketConfig)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isCustomer = user?.role === "CUSTOMER";
  const isStaff = user?.role === "STAFF" || user?.role === "ADMIN";

  // ------------------------------------------------------------------
  // SYNC conversationId truyền từ STAFF
  // ------------------------------------------------------------------
  useEffect(() => {
    if (propConversationId) setConversationId(propConversationId);
  }, [propConversationId]);

  // ------------------------------------------------------------------
  // CUSTOMER: tự tạo conversation nếu chưa có
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isCustomer) return;
    if (conversationId) return;

    const cid = `customer-${user.accountId}`;
    const membersRef = ref(db, `chats/${cid}/members`);

    set(membersRef, {
      customerId: user.accountId,
      customerName: user.fullName,
      createdAt: Date.now(),
    }).then(() => {
      setConversationId(cid);
    });
  }, [conversationId, isCustomer, user]);

  // ------------------------------------------------------------------
  // LOAD MESSAGES
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!conversationId) return;

    const msgRef = ref(db, `chats/${conversationId}/messages`);

    const unsub = onValue(msgRef, (snap) => {
      const raw = snap.val() as Record<string, Omit<Message, "id">> | null;

      const arr: Message[] = raw
        ? Object.entries(raw).map(([id, value]) => ({
            id,
            ...value,
          }))
        : [];

      arr.sort((a, b) => a.timestamp - b.timestamp);

      setMessages(arr);
    });

    return () => unsub();
  }, [conversationId]);

  // ------------------------------------------------------------------
  // AUTO SCROLL
  // ------------------------------------------------------------------
  const atBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  useEffect(() => {
    if (atBottom()) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------------------------
  // SEND MESSAGE
  // ------------------------------------------------------------------
  const send = async () => {
    if (!text.trim() || !conversationId) return;

    const payload = {
      senderId: user.accountId,
      fullName: user.fullName,
      messageContent: text.trim(),
      timestamp: Date.now(),
    };

    await push(ref(db, `chats/${conversationId}/messages`), payload);

    setText("");
  };

  // ------------------------------------------------------------------
  // GROUP MESSAGES BY DATE
  // ------------------------------------------------------------------
  const grouped: Record<string, Message[]> = {};
  messages.forEach((m) => {
    const k = groupKey(m.timestamp);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(m);
  });

  const dateKeys = Object.keys(grouped).sort();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
        <Text strong>{isStaff ? customerName || "Hỗ trợ khách hàng" : "Hỗ trợ khách hàng"}</Text>
      </div>

      {/* CHAT BODY */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          background: "#f7f9fb",
        }}
      >
        {dateKeys.map((k) => (
          <div key={k}>
            {/* DAY HEADER */}
            <div style={{ textAlign: "center", margin: "16px 0", opacity: 0.6 }}>{groupLabel(k)}</div>

            {grouped[k].map((m) => {
              const mine = m.senderId === user.accountId;

              return (
                <div key={m.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      gap: 8,
                    }}
                  >
                    {!mine && <Avatar>{m.fullName?.charAt(0)}</Avatar>}

                    <Tooltip title={fullTime(m.timestamp)}>
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "10px 14px",
                          borderRadius: 18,
                          background: mine ? "#1890ff" : "white",
                          color: mine ? "white" : "black",
                          borderBottomRightRadius: mine ? 6 : 18,
                          borderBottomLeftRadius: mine ? 18 : 6,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      >
                        {!mine && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{m.fullName}</div>}

                        {m.messageContent}
                      </div>
                    </Tooltip>

                    {mine && <Avatar>{m.fullName?.charAt(0)}</Avatar>}
                  </div>

                  {/* TIME */}
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      opacity: 0.6,
                      textAlign: mine ? "right" : "left",
                      marginRight: mine ? 40 : 0,
                      marginLeft: mine ? 0 : 40,
                    }}
                  >
                    {relativeVN(m.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BOX */}
      <div style={{ padding: 10, borderTop: "1px solid #ddd", background: "#fff" }}>
        <TextArea
          rows={2}
          value={text}
          placeholder="Nhập tin nhắn..."
          onChange={(e) => setText(e.target.value)}
          onPressEnter={(e) => {
            e.preventDefault();
            send();
          }}
        />

        <Button type="primary" disabled={!text.trim()} onClick={send} style={{ marginTop: 8, float: "right" }}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
