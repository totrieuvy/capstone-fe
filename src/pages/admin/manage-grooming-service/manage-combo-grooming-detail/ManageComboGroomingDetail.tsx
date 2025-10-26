import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Tag, Spin, Alert, Button, List, Typography, Table, Space } from "antd";
import { ArrowLeftOutlined, InfoCircleOutlined, TagsOutlined, AppstoreOutlined } from "@ant-design/icons";
import api from "../../../../config/axios";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./ManageComboGroomingDetail.scss";
import type { TableColumnsType } from "antd";
import { AxiosError } from "axios";

interface ApiResponse {
  code: number;
  message: string;
}

const { Title, Text, Paragraph } = Typography;

// --- Interfaces based on detail API response ---
interface ComboDetailService {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
}

interface ComboDetailPrice {
  speciesId: string;
  speciesName: string;
  price: number; // Base price
  priceAfter: number; // Discounted price
}

interface ComboDetail {
  id: string;
  comboName: string;
  description: string;
  isActive: boolean;
  services: ComboDetailService[];
  prices: ComboDetailPrice[];
}

function ManageComboGroomingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comboDetail, setComboDetail] = useState<ComboDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        setError("Không tìm thấy ID combo.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ code: number; data: ComboDetail }>(`/api/combo/${id}`);
        if (response.data.code === 200 && response.data.data) {
          setComboDetail(response.data.data);
          document.title = `Chi tiết Combo: ${response.data.data.comboName}`;
        }
      } catch (error: unknown) {
        const err = error as AxiosError<ApiResponse>;
        setError(err.message || "Lỗi khi tải chi tiết combo.");
        console.error("Fetch combo detail error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // Columns for the Price Table
  const priceColumns: TableColumnsType<ComboDetailPrice> = [
    {
      title: "Loài Hamster",
      dataIndex: "speciesName",
      key: "speciesName",
      width: "10%",
    },
    {
      title: "Giá Gốc (Tổng DV)",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (price: number) => getFormattedPrice(price),
    },
    {
      title: "Giá Combo (Sau giảm)",
      dataIndex: "priceAfter",
      key: "priceAfter",
      align: "right",
      render: (priceAfter: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {getFormattedPrice(priceAfter)}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ManageComboGroomingDetail">
        <div className="detail-loading">
          <Spin size="large" />
          <Text type="secondary">Đang tải chi tiết combo...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ManageComboGroomingDetail">
        <div className="detail-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)} // Go back to the list
            className="back-button"
          >
            Quay lại danh sách
          </Button>
        </div>
        <div className="detail-error">
          <Alert message="Lỗi" description={error} type="error" showIcon />
        </div>
      </div>
    );
  }

  if (!comboDetail) {
    return (
      <div className="ManageComboGroomingDetail">
        <div className="detail-header">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
            Quay lại
          </Button>
        </div>
        <div className="detail-error">
          <Alert
            message="Thông báo"
            description="Không tìm thấy thông tin chi tiết cho combo này."
            type="warning"
            showIcon
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ManageComboGroomingDetail">
      {/* Header */}
      <div className="detail-header">
        <Space align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button">
            Quay lại
          </Button>
          <Title level={3} className="combo-title">
            {comboDetail.comboName}
          </Title>
        </Space>
        <Tag color={comboDetail.isActive ? "green" : "red"}>
          {comboDetail.isActive ? "Đang hoạt động" : "Không hoạt động"}
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
          <Descriptions.Item label="ID Combo">{comboDetail.id}</Descriptions.Item>
          <Descriptions.Item label="Tên Combo">{comboDetail.comboName}</Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            <Paragraph style={{ margin: 0 }}>{comboDetail.description}</Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={comboDetail.isActive ? "green" : "red"}>
              {comboDetail.isActive ? "Hoạt động" : "Không hoạt động"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Included Services Card */}
      <Card
        className="detail-card"
        title={
          <>
            <AppstoreOutlined /> Dịch vụ bao gồm ({comboDetail.services.length})
          </>
        }
        bordered={false}
      >
        <List
          itemLayout="horizontal"
          dataSource={comboDetail.services}
          renderItem={(service) => (
            <List.Item className="service-list-item">
              <List.Item.Meta
                title={<span className="service-name">{service.serviceName}</span>}
                description={<span className="service-description">{service.description}</span>}
              />
              <Tag>{service.serviceType}</Tag>
            </List.Item>
          )}
        />
      </Card>

      {/* Prices Card */}
      <Card
        className="detail-card"
        title={
          <>
            <TagsOutlined /> Bảng giá theo loài
          </>
        }
        bordered={false}
      >
        <Table
          columns={priceColumns}
          dataSource={comboDetail.prices}
          rowKey="speciesId"
          pagination={false} // No pagination needed for price list within detail
          className="price-table"
          size="small"
        />
      </Card>
    </div>
  );
}

export default ManageComboGroomingDetail;
