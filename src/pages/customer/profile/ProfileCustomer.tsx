import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Spin, Row, Col, message, Button, Modal, Form, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import "./ViewProfile.scss";

interface MembershipHistory {
  membershipRank: string;
  startDate: string;
  endDate: string;
  discountPercent: number;
  isActive: boolean;
  requiredPoints: number;
  minPointsToKeep: number;
}

interface CustomerProfile {
  email: string;
  phone: string;
  fullName: string;
  address: string;
  citizenId: string;
  rank: string;
  currentPoint: string;
  membershipHistoryList: MembershipHistory[];
}

interface ApiResponse {
  code: number;
  message: string;
  data: CustomerProfile;
}

interface UpdateProfileValues {
  email: string;
  phone: string;
  fullName: string;
  address: string;
}

const ViewProfile = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = "Hồ sơ khách hàng";
    fetchProfile();
  }, []);

  const fetchProfile = async (): Promise<void> => {
    try {
      const res = await api.get<ApiResponse>("/api/customer");
      if (res.data.code === 200) {
        setProfile(res.data.data);
      } else {
        message.error(res.data.message || "Không thể tải hồ sơ khách hàng!");
      }
    } catch (error) {
      message.error("Không thể tải hồ sơ khách hàng!" + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const showUpdateModal = () => {
    if (profile) {
      form.setFieldsValue({
        email: profile.email,
        phone: profile.phone,
        fullName: profile.fullName,
        address: profile.address,
      });
      setIsModalOpen(true);
    }
  };

  const handleUpdateProfile = async (values: UpdateProfileValues) => {
    setUpdating(true);
    try {
      const response = await api.put("/api/customer", values);
      if (response.data.code === 200) {
        toast.success("Cập nhật hồ sơ thành công");
        setIsModalOpen(false);
        fetchProfile();
      } else {
        toast.error(response.data.message || "Cập nhật thất bại!");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi cập nhật hồ sơ!");
    } finally {
      setUpdating(false);
    }
  };

  const getRankColor = (rank: string): string => {
    switch (rank.toUpperCase()) {
      case "BRONZE":
        return "volcano";
      case "SILVER":
      case "SLIVER": // fix data typo
        return "gray";
      case "GOLD":
        return "gold";
      case "PLATINUM":
        return "blue";
      default:
        return "purple";
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" tip="Đang tải hồ sơ..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-loading">
        <p>Không tìm thấy thông tin khách hàng.</p>
      </div>
    );
  }

  return (
    <div className="view-profile-page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 className="page-title">🐹 Hồ sơ Khách hàng</h1>
          <Button type="primary" icon={<EditOutlined />} onClick={showUpdateModal}>
            Cập nhật hồ sơ
          </Button>
        </div>

        {/* Thông tin cá nhân */}
        <Card className="profile-card" title="Thông tin cá nhân" bordered={false}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Họ và tên">{profile.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{profile.phone}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{profile.address}</Descriptions.Item>
            {/* <Descriptions.Item label="CCCD/CMND">{profile.citizenId}</Descriptions.Item> */}
            <Descriptions.Item label="Hạng hiện tại">
              <Tag color={getRankColor(profile.rank)} style={{ fontWeight: 600 }}>
                {profile.rank}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Điểm hiện tại">
              <strong style={{ color: "#ff6f61" }}>{profile.currentPoint}</strong>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Lịch sử thành viên */}
        <h2 className="sub-title">Lịch sử thành viên</h2>
        <Row gutter={[24, 24]}>
          {profile.membershipHistoryList.map((m: MembershipHistory, index: number) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                className={`membership-card ${m.isActive ? "active" : ""}`}
                title={`Hạng: ${m.membershipRank}`}
                bordered={false}
              >
                <p>
                  <b>Thời gian:</b> {m.startDate} → {m.endDate}
                </p>
                <p>
                  <b>Giảm giá:</b> {m.discountPercent}%
                </p>
                <p>
                  <b>Điểm yêu cầu:</b> {m.requiredPoints}
                </p>
                <p>
                  <b>Điểm tối thiểu duy trì:</b> {m.minPointsToKeep}
                </p>
                <p>
                  <Tag color={m.isActive ? "green" : "default"}>{m.isActive ? "Đang hoạt động" : "Đã hết hạn"}</Tag>
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Modal Cập nhật hồ sơ */}
      <Modal
        title="Cập nhật hồ sơ"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={updating} onClick={() => form.submit()}>
            Cập nhật
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại phải từ 10-11 chữ số!" },
            ]}
          >
            <Input
              placeholder="Nhập số điện thoại"
              maxLength={11}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                form.setFieldValue("phone", value);
              }}
            />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address" rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}>
            <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewProfile;
