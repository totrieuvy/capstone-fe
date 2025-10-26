import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Tag, Spin, Alert, Button, Typography, Space } from "antd";
import { ArrowLeftOutlined, InfoCircleOutlined, TagsOutlined, ClockCircleOutlined } from "@ant-design/icons";
import api from "../../../../config/axios";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./ManageGroomingServiceDetail.scss";
import dayjs from "dayjs";
import { AxiosError } from "axios";

interface ApiResponse {
  code: number;
  message: string;
}

const { Title, Text, Paragraph } = Typography;

interface ServicePriceDetail {
  priceId: string;
  speciesId: string;
  speciesName: string;
  price: number;
}

interface ServiceDetail {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  prices: ServicePriceDetail[];
}

function ManageGroomingServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        setError("Không tìm thấy ID dịch vụ.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ code: number; data: ServiceDetail }>(`/api/services/${id}`);
        if (response.data.code === 200 && response.data.data) {
          setServiceDetail(response.data.data);
          document.title = `Chi tiết DV: ${response.data.data.serviceName}`;
        }
      } catch (error: unknown) {
        const err = error as AxiosError<ApiResponse>;
        setError(err.message || "Lỗi khi tải chi tiết dịch vụ.");
        console.error("Fetch service detail error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="ManageGroomingServiceDetail">
        <div className="detail-loading">
          <Spin size="large" />
          <Text type="secondary">Đang tải chi tiết dịch vụ...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ManageGroomingServiceDetail">
        <div className="detail-header">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
            Quay lại
          </Button>
        </div>
        <div className="detail-error">
          <Alert message="Lỗi" description={error} type="error" showIcon />
        </div>
      </div>
    );
  }

  if (!serviceDetail) {
    return (
      <div className="ManageGroomingServiceDetail">
        <div className="detail-header">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
            Quay lại
          </Button>
        </div>
        <div className="detail-error">
          <Alert
            message="Thông báo"
            description="Không tìm thấy thông tin chi tiết cho dịch vụ này."
            type="warning"
            showIcon
          />
        </div>
      </div>
    );
  }

  // Format Date Function
  const formatDate = (dateString: string | null) => {
    return dateString ? dayjs(dateString).format("DD/MM/YYYY HH:mm:ss") : "N/A";
  };

  return (
    <div className="ManageGroomingServiceDetail">
      {/* Header */}
      <div className="detail-header">
        <Space align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
            Quay lại danh sách
          </Button>
          <Title level={3} className="service-title">
            {serviceDetail.serviceName}
          </Title>
        </Space>
        <Tag color={serviceDetail.isActive ? "green" : "red"}>
          {serviceDetail.isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      </div>

      {/* Basic Info Card */}
      <Card
        className="detail-card"
        title={
          <>
            <InfoCircleOutlined /> Thông tin cơ bản
          </>
        }
        bordered={false}
      >
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="ID Dịch vụ">{serviceDetail.id}</Descriptions.Item>
          <Descriptions.Item label="Tên Dịch vụ">{serviceDetail.serviceName}</Descriptions.Item>
          <Descriptions.Item label="Loại Dịch vụ">{serviceDetail.serviceType}</Descriptions.Item>
          <Descriptions.Item label="Thời lượng">
            <Space>
              <ClockCircleOutlined /> {serviceDetail.durationMinutes} phút
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            <Paragraph style={{ margin: 0 }}>{serviceDetail.description}</Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Khoảng giá hiển thị">
            {serviceDetail.displayPrice?.replace(".00", "")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={serviceDetail.isActive ? "green" : "red"}>
              {serviceDetail.isActive ? "Hoạt động" : "Không hoạt động"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDate(serviceDetail.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        className="detail-card"
        title={
          <>
            <TagsOutlined /> Bảng giá chi tiết theo loài
          </>
        }
        bordered={false}
      >
        <div className="price-container">
          <div className="price-header">
            <span className="col species">Loài Hamster</span>
            <span className="col price">Giá (VND)</span>
          </div>

          {serviceDetail.prices.map((item) => (
            <div key={item.priceId} className="price-row">
              <span className="col species">{item.speciesName}</span>
              <span className="col price">{getFormattedPrice(item.price)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default ManageGroomingServiceDetail;
