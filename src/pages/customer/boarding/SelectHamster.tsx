import { Card, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";

interface HamsterProfile {
  id: string;
  name: string;
  color: string;
  dob: string;
  species: string;
  gender: "Male" | "Female";
  weight: number;
  profilePicture: string;
  healthNote: string;
}

interface SelectHamsterProps {
  profiles: HamsterProfile[];
  loading: boolean;
  selectedHamsterId: string | null;
  onSelectHamster: (hamsterId: string) => void;
}

function SelectHamster({ 
  profiles, 
  loading, 
  selectedHamsterId, 
  onSelectHamster 
}: SelectHamsterProps) {
  const navigate = useNavigate();

  return (
    <div className="step-select-hamster">
      <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
        Chọn Hamster của bạn
      </h3>

      {profiles.length === 0 && !loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#ff6f61",
            fontSize: "18px",
            fontWeight: 500,
          }}
        >
          🐹 Chưa có hồ sơ hamster nào. Vui lòng tạo hồ sơ trước{" "}
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              color: "#ff6f61",
              fontWeight: 600,
            }}
            onClick={() => navigate("/profile/your-hamster")}
          >
            tại đây
          </span>
          .
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {profiles.map((hamster) => (
            <Col xs={24} sm={24} md={12} lg={8} key={hamster.id}>
              <Card
                hoverable
                className={`hamster__card-compact ${
                  selectedHamsterId === hamster.id ? "selected" : ""
                }`}
                onClick={() => onSelectHamster(hamster.id)}
                style={{
                  border:
                    selectedHamsterId === hamster.id
                      ? "3px solid #ff6f61"
                      : "2px solid #f0f0f0",
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ display: "flex", height: "100%" }}>
                  {/* Left Column - Image */}
                  <div style={{ width: 150, flexShrink: 0 }}>
                    <img
                      src={hamster.profilePicture}
                      alt={hamster.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "10px 0 0 10px",
                      }}
                    />
                  </div>

                  {/* Right Column - Information */}
                  <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#ff6f61",
                        margin: "0 0 8px 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {hamster.name}
                    </h4>
                    <div className="hamster__info-compact">
                      <p>
                        <span className="label">Loài:</span>
                        <span className="value">{hamster.species}</span>
                      </p>
                      <p>
                        <span className="label">Ngày sinh:</span>
                        <span className="value">{hamster.dob}</span>
                      </p>
                      <p>
                        <span className="label">Màu:</span>
                        <span className="value">{hamster.color}</span>
                      </p>
                      <p>
                        <span className="label">Giới tính:</span>
                        <span className="value">{hamster.gender === "Male" ? "Đực" : "Cái"}</span>
                      </p>
                      <p>
                        <span className="label">Cân nặng:</span>
                        <span className="value">{hamster.weight}g</span>
                      </p>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedHamsterId === hamster.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "#ff6f61",
                        color: "white",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default SelectHamster;