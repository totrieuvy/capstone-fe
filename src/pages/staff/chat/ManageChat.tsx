// src/staff/chat/ManageChat.tsx
import React, { useEffect, useState } from "react";
import { Card, List, Avatar, Row, Col, Empty } from "antd";
import Chat from "../../customer/chat/Chat";

export default function ManageChat() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    // TODO: Gọi API để lấy danh sách các customer đang chat
    // ví dụ:
    // GET /api/chat/customers
    //
    // tạm thời demo:
    setCustomers([
      { id: "cus-123", name: "Nguyen A" },
      { id: "cus-456", name: "Tran B" },
    ]);
  }, []);

  return (
    <Row gutter={16} style={{ height: "calc(100vh - 120px)" }}>
      <Col span={6}>
        <Card title="Khách đang chat">
          <List
            dataSource={customers}
            renderItem={(c) => (
              <List.Item
                onClick={() => setSelected(c)}
                style={{
                  cursor: "pointer",
                  background: selected?.id === c.id ? "#eee" : "",
                }}
              >
                <List.Item.Meta avatar={<Avatar>{c.name[0]}</Avatar>} title={c.name} description={`ID: ${c.id}`} />
              </List.Item>
            )}
          />
          {customers.length === 0 && <Empty description="Không có khách nào" />}
        </Card>
      </Col>

      <Col span={18}>
        <Card style={{ height: "100%" }}>
          {selected ? <Chat conversationId={selected.id} /> : <Empty description="Chọn khách để chat" />}
        </Card>
      </Col>
    </Row>
  );
}
