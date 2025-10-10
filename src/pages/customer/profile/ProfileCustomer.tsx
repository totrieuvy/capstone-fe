import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Spin, Row, Col, message } from "antd";
import api from "../../../config/axios";
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

const ViewProfile = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
        <h1 className="page-title">🐹 Hồ sơ Khách hàng</h1>

        {/* Thông tin cá nhân */}
        <Card className="profile-card" title="Thông tin cá nhân" bordered={false}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Họ và tên">{profile.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{profile.phone}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{profile.address}</Descriptions.Item>
            <Descriptions.Item label="CCCD/CMND">{profile.citizenId}</Descriptions.Item>
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
    </div>
  );
};

export default ViewProfile;
