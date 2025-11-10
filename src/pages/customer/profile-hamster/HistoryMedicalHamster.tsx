import { useEffect, useState } from "react";
import { Card, Spin, Button, Timeline, Empty, Typography, Descriptions, Image } from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../config/axios";
import "./HistoryMedicalHamster.scss"; // Đổi tên file SCSS cho nhất quán

const { Title, Text } = Typography;

// (Interface giữ nguyên)
interface MedicalRecordItem {
  medicalRecordId: string;
  serviceName: string;
  vetName: string;
  diagnosis: string;
  symptom: string;
  linkResult: string;
}

interface MedicalRecord {
  hamsterId: string;
  hamsterName: string;
  gender: string;
  species: string;
  appointmentDate: string;
  slotStart: string;
  slotEnd: string;
  prescriptionUrl: string | null;
  medicalRecordItem: MedicalRecordItem[];
}

function HistoryMedicalHamster() {
  const { hamsterId } = useParams<{ hamsterId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin hamster từ bản ghi đầu tiên (nếu có)
  const hamsterInfo = records.length > 0 ? records[0] : null;

  useEffect(() => {
    document.title = "Lịch sử khám Hamster";
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hamsterId]); // Thêm hamsterId vào dependency array

  const fetchHistory = async () => {
    if (!hamsterId) return; // Đảm bảo có hamsterId
    setLoading(true); // Set loading khi bắt đầu fetch
    try {
      const { data } = await api.get(`/api/medical-record/hamster/${hamsterId}`);
      if (data.code === 200) {
        // Sắp xếp lịch sử theo ngày, mới nhất lên trên
        const sortedData = data.data.sort(
          (a: MedicalRecord, b: MedicalRecord) =>
            new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        setRecords(sortedData);
      }
    } catch {
      console.error("Không thể tải lịch sử khám");
    } finally {
      setLoading(false);
    }
  };

  // Hàm render thông tin chung của Hamster
  const renderHamsterInfo = () => (
    <Card className="hamster-info-card" bordered={false}>
      <Descriptions title="Thông tin Hamster" bordered column={2}>
        <Descriptions.Item label="Tên Hamster">
          <Text strong style={{ color: "#0052cc" }}>
            {hamsterInfo?.hamsterName}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Giới tính">{hamsterInfo?.gender}</Descriptions.Item>
        <Descriptions.Item label="Loài">{hamsterInfo?.species}</Descriptions.Item>
      </Descriptions>
    </Card>
  );

  return (
    <div className="history-medical-container">
      {/* Header */}
      <div className="history-medical-header">
        <Title level={2} className="header-title">
          🧾 Lịch sử khám của {hamsterInfo?.hamsterName || (loading ? "..." : "Hamster")}
        </Title>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="back-button" type="primary" ghost>
          Quay lại
        </Button>
      </div>

      <Spin spinning={loading} size="large" tip="Đang tải lịch sử khám...">
        {!loading && records.length === 0 && <Empty description="Chưa có lịch sử khám nào" />}

        {/* Chỉ hiển thị thông tin khi có bản ghi */}
        {!loading && hamsterInfo && renderHamsterInfo()}

        {records.length > 0 && (
          <Timeline
            mode="left"
            className="medical-timeline"
            items={records.map((rec) => ({
              color: "#007bff",
              dot: <CalendarOutlined />,
              children: (
                <Card
                  hoverable
                  className="timeline-card"
                  title={
                    <span className="timeline-card-title">
                      <CalendarOutlined /> Ngày khám: {rec.appointmentDate} ({rec.slotStart} - {rec.slotEnd})
                    </span>
                  }
                >
                  {/* Hiển thị nút đơn thuốc nếu có */}
                  {rec.prescriptionUrl && (
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      className="prescription-button"
                      href={rec.prescriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem đơn thuốc
                    </Button>
                  )}

                  {rec.medicalRecordItem.map((item) => (
                    <div key={item.medicalRecordId} className="service-item">
                      <Title level={4} className="service-item-title">
                        {item.serviceName}
                      </Title>
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item
                          label={
                            <>
                              <UserOutlined /> Bác sĩ phụ trách
                            </>
                          }
                        >
                          {item.vetName || "Chưa xác định"}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <>
                              <InfoCircleOutlined /> Triệu chứng
                            </>
                          }
                        >
                          {item.symptom}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={
                            <>
                              <MedicineBoxOutlined /> Chẩn đoán
                            </>
                          }
                        >
                          {item.diagnosis}
                        </Descriptions.Item>
                        {item.linkResult && (
                          <Descriptions.Item
                            label={
                              <>
                                <ExperimentOutlined /> Kết quả
                              </>
                            }
                          >
                            <div className="result-image-wrapper">
                              {/* Sử dụng <Image /> của antd để có thể xem preview */}
                              <Image src={item.linkResult} alt="Kết quả khám" className="result-image" />
                            </div>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </div>
                  ))}
                </Card>
              ),
            }))}
          />
        )}
      </Spin>
    </div>
  );
}

export default HistoryMedicalHamster;
