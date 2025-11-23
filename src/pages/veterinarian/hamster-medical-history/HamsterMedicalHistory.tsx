import { useEffect, useState } from "react";
import { Card, Spin, Button, Timeline, Empty, Typography, Descriptions, Image } from "antd";
import { ArrowLeftOutlined, CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../config/axios";
import "./HamsterMedicalHistory.scss";

const { Title, Text } = Typography;

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

function HamsterMedicalHistory() {
  const { hamsterId } = useParams<{ hamsterId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Item được mở ra
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const hamsterInfo = records.length > 0 ? records[0] : null;

  useEffect(() => {
    document.title = "Lịch sử khám Hamster";
    fetchHistory();
  }, [hamsterId]);

  const fetchHistory = async () => {
    if (!hamsterId) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/api/medical-record/hamster/${hamsterId}`);
      if (data.code === 200) {
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

        {!loading && hamsterInfo && renderHamsterInfo()}

        {records.length > 0 && (
          <Timeline
            mode="left"
            className="medical-timeline"
            items={records.map((rec) => {
              const id = rec.hamsterId + rec.appointmentDate;

              return {
                color: "#007bff",
                dot: <CalendarOutlined />,
                children: (
                  <Card hoverable className="timeline-card" onClick={() => toggleOpen(id)}>
                    {/* Tóm tắt timeline */}
                    <div className="timeline-summary">
                      <Text strong>
                        🗓 {rec.appointmentDate} ({rec.slotStart} - {rec.slotEnd})
                      </Text>
                      <br />
                      <Text type="secondary">{rec.medicalRecordItem.length} dịch vụ</Text>
                    </div>

                    {/* Nếu được click → xổ ra */}
                    {openId === id && (
                      <div className="timeline-details">
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
                              <Descriptions.Item label="Bác sĩ">{item.vetName}</Descriptions.Item>

                              <Descriptions.Item label="Triệu chứng">{item.symptom}</Descriptions.Item>

                              <Descriptions.Item label="Chẩn đoán">{item.diagnosis}</Descriptions.Item>

                              {item.linkResult && (
                                <Descriptions.Item label="Kết quả">
                                  <Image src={item.linkResult} width={200} />
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ),
              };
            })}
          />
        )}
      </Spin>
    </div>
  );
}

export default HamsterMedicalHistory;