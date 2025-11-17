import { useEffect, useState } from "react";
import { Card, List, Avatar, Row, Col, Empty } from "antd";
import { db } from "../../../config/firebase";
import { ref, onValue, set } from "firebase/database";
import Chat from "../../customer/chat/Chat";

type ConversationMembers = {
  customerId?: string;
  customerName?: string;
  createdAt?: number;
  staffs?: Record<string, { staffId: string; staffName: string; joinedAt: number }>;
};

type Conversation = {
  id: string;
  name: string;
  members: ConversationMembers;
};

export default function ManageChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");

  // Lấy user từ localStorage
  const staffUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const convRef = ref(db, "chats");

    const unsub = onValue(convRef, (snapshot) => {
      const raw = snapshot.val() || {};

      const list: Conversation[] = Object.keys(raw).map((key) => {
        const members = raw[key].members || {};
        return {
          id: key,
          name: members.customerName || `Khách ${key}`,
          members,
        };
      });

      setConversations(list);
    });

    return () => unsub();
  }, []);

  const joinConversation = async (conversationId: string) => {
    if (!staffUser?.accountId) return;

    const staffRef = ref(db, `chats/${conversationId}/members/staffs/${staffUser.accountId}`);

    await set(staffRef, {
      staffId: staffUser.accountId,
      staffName: staffUser.fullName,
      joinedAt: Date.now(),
    });

    const conv = conversations.find((c) => c.id === conversationId) || null;
    setSelected(conv);
    setSelectedName(conv?.name || "");
  };

  return (
    <Row gutter={16} style={{ height: "calc(100vh - 120px)" }}>
      <Col span={6}>
        <Card title="Khách đang chat">
          <List
            dataSource={conversations}
            renderItem={(c) => (
              <List.Item
                onClick={() => joinConversation(c.id)}
                style={{
                  cursor: "pointer",
                  background: selected?.id === c.id ? "#eee" : "",
                  borderRadius: 6,
                }}
              >
                <List.Item.Meta avatar={<Avatar>{c.name[0]}</Avatar>} title={c.name} />
              </List.Item>
            )}
          />

          {/* {conversations.length === 0 && <Empty description="Không có cuộc chat nào" />} */}
        </Card>
      </Col>

      <Col span={18}>
        <Card style={{ height: "100%" }}>
          {selected ? (
            <Chat conversationId={selected.id} customerName={selectedName} />
          ) : (
            <Empty description="Chọn khách để chat" />
          )}
        </Card>
      </Col>
    </Row>
  );
}
