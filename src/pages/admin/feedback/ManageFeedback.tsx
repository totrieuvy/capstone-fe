import { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card } from "antd";
import type { TableColumnsType } from "antd";
import api from "../../../config/axios";
import "./ManageFeedback.scss";
import { toast } from "react-toastify";

const { Option } = Select;

interface FeedbackResponse {
  responseId: string;
  staffId: string;
  staffName: string;
  comment: string;
  createdAt: string;
}

interface Feedback {
  feedbackId: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  staffName: string | null;
  responses: FeedbackResponse[];
}

function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filtered, setFiltered] = useState<Feedback[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [loading, setLoading] = useState(false);

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyForm] = Form.useForm();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get("/api/feedbacks");
      setFeedbacks(res.data.data);
      setFiltered(res.data.data);
    } catch (e) {
      message.error("Không thể tải feedback!");
    }
  };

  useEffect(() => {
    document.title = "Quản lí Feedback";
    fetchFeedbacks();
  }, []);

  const handleFilterRating = (rating: number | "ALL") => {
    setRatingFilter(rating);
    if (rating === "ALL") {
      setFiltered(feedbacks);
    } else {
      setFiltered(feedbacks.filter((f) => f.rating === rating));
    }
  };

  const openReplyModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (values: any) => {
    if (!selectedFeedback) return;

    setLoading(true);
    try {
      await api.post("/api/feedbacks", {
        productId: selectedFeedback.productId,
        comment: values.reply,
      });

      toast.success("Phản hồi thành công!");
      fetchFeedbacks();
      setReplyModalOpen(false);
      replyForm.resetFields();
    } catch (error) {
      toast.error("Phản hồi thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumnsType<Feedback> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (text) => <b style={{ color: "#1677ff" }}>{text}</b>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => <Tag color="gold">{rating} ★</Tag>,
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: "Bình luận",
      dataIndex: "comment",
      key: "comment",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Phản hồi",
      key: "responses",
      render: (_, record) =>
        record.responses.length > 0 ? (
          <Card size="small" style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}>
            {record.responses.map((res) => (
              <p key={res.responseId} style={{ marginBottom: 6 }}>
                <b>{res.staffName}:</b> {res.comment}
              </p>
            ))}
          </Card>
        ) : (
          <Button type="primary" onClick={() => openReplyModal(record)}>
            Phản hồi
          </Button>
        ),
    },
  ];

  return (
    <div className="ManageProduct">
      <h1>Quản lí Feedback</h1>

      {/* Filter Rating */}
      <div className="filter-category">
        <Button
          type={ratingFilter === "ALL" ? "primary" : "default"}
          shape="round"
          className="category-btn"
          onClick={() => handleFilterRating("ALL")}
        >
          Tất cả
        </Button>

        {[1, 2, 3, 4, 5].map((r) => (
          <Button
            key={r}
            type={ratingFilter === r ? "primary" : "default"}
            shape="round"
            className="category-btn"
            onClick={() => handleFilterRating(r)}
          >
            {r} ★
          </Button>
        ))}
      </div>

      <Table columns={columns} dataSource={filtered} rowKey="feedbackId" pagination={{ pageSize: 5 }} />

      {/* Reply Modal */}
      <Modal open={replyModalOpen} title="Phản hồi khách hàng" onCancel={() => setReplyModalOpen(false)} footer={null}>
        <Form form={replyForm} layout="vertical" onFinish={handleReplySubmit}>
          <Form.Item
            label="Nội dung phản hồi"
            name="reply"
            rules={[{ required: true, message: "Vui lòng nhập phản hồi" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập phản hồi..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Gửi phản hồi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ManageFeedback;
