import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, Input, Button, Select, message, Row, Col, Radio, Spin, Form, Checkbox, Alert } from "antd";
// --- Policy Interface ---
interface Policy {
  id: string;
  policyName: string;
  description: string;
  applicableServices: string;
  status: string;
  refundPercentage: number;
  timesBeforeCheckin: number;
}
// import { clearCart } from "../../../redux/features/cartSlice";
import api from "../../../config/axios";
import "./Checkout.scss";
import type { AxiosError } from "axios";

import { useDispatch } from "react-redux";
import { removeFromCart } from "../../../redux/features/cartSlice";
import { toast } from "react-toastify";

import { useNavigate } from "react-router-dom";

// --- Interface Definitions ---
interface District {
  id: number;
  districtName: string;
}

interface Ward {
  wardCode: string;
  wardName: string;
}

interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
}

interface MembershipResponse {
  code: number;
  message: string;
  data: {
    discountPercent: number;
    rankName: string;
    currentPoint: number;
  };
}

interface ShippingFeeResponse {
  code: number;
  message: string;
  data: {
    total: number;
    [key: string]: number;
  };
  success: boolean;
}

interface OrderItemPayload {
  productId: string | number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderResponse {
  code: number;
  message: string;
  data?: { paymentUrl: string };
}

interface CartItem {
  id: number | string;
  name: string;
  quantity: number;
  stockQuantity: number;
  price?: number;
  imageUrl?: string;
  weight: number;
}

interface RootState {
  cart: { items: CartItem[] };
}

const Checkout = () => {
  // const dispatch = useDispatch();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);

  // --- State Management ---
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [addressDetail, setAddressDetail] = useState<string>("");
  const [fee, setFee] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [shipLoading, setShipLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "PAYOS" | "WALLET">("VNPAY");
  // Policy state
  const [orderPolicies, setOrderPolicies] = useState<Policy[]>([]);
  const [policyChecked, setPolicyChecked] = useState(false);
  // Validation errors
  const [nameError, setNameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");

  const totalWeight = cartItems.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/mua-hang");
    }
  }, [cartItems, navigate]);

  // Fetch refund/order policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const { data } = await api.get("/api/policy");
        if (data.code === 200 && Array.isArray(data.data)) {
          const filtered = data.data.filter((p: Policy) => p.applicableServices === "ORDER" && p.status === "ACTIVE");
          setOrderPolicies(filtered);
        }
      } catch {
        // ignore
      }
    };
    fetchPolicies();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    document.title = "Thanh toán";
    fetchDistricts();
    fetchMembership();
    fetchCustomerInfo(); // Fetch customer info on component mount
  }, []);

  const fetchCustomerInfo = async () => {
    try {
      const { data }: { data: { code: number; data: CustomerInfo } } = await api.get("/api/customer");
      if (data.code === 200 && data.data) {
        setFullName(data.data.fullName);
        setPhone(data.data.phone);
      }
    } catch {
      message.error("Không thể tải thông tin khách hàng.");
    }
  };

  const fetchDistricts = async () => {
    try {
      const { data } = await api.get("/api/address/district");
      if (data.code === 200) setDistricts(data.data);
      else message.error("Không tải được danh sách quận/huyện.");
    } catch {
      message.error("Lỗi khi tải danh sách quận/huyện.");
    }
  };

  const fetchWards = async (districtId: number) => {
    try {
      const { data } = await api.get(`/api/address/ward?districtId=${districtId}`);
      if (data.code === 200) setWards(data.data);
      else message.error("Không tải được danh sách phường/xã.");
    } catch {
      message.error("Lỗi khi tải danh sách phường/xã.");
    }
  };

  const fetchMembership = async () => {
    try {
      const { data }: { data: MembershipResponse } = await api.get("/api/membership");
      if (data.code === 200) setDiscountPercent(data.data.discountPercent || 0);
    } catch {
      // Non-critical error, a warning is sufficient
    }
  };

  // --- Event Handlers ---
  const handleDistrictChange = (value: number) => {
    setSelectedDistrict(value);
    setWards([]);
    setSelectedWard("");
    setFee(null); // Reset fee when district changes
    fetchWards(value);
  };

  const handleWardChange = (value: string) => {
    setSelectedWard(value);
    setFee(null); // Reset fee when ward changes
  };

  const handleCalculateFee = async () => {
    if (!addressDetail.trim()) {
      toast.warning("Vui lòng nhập địa chỉ cụ thể trước khi tính phí.");
      return;
    }

    if (!selectedDistrict || !selectedWard) {
      toast.warning("Vui lòng chọn đầy đủ quận/huyện và phường/xã.");
      return;
    }

    if (!selectedDistrict || !selectedWard) {
      toast.warning("Vui lòng chọn đầy đủ quận/huyện và phường/xã.");
      return;
    }

    setShipLoading(true);
    try {
      const payload = {
        toWardCode: selectedWard,
        toDistrictId: selectedDistrict,
        weight: totalWeight,
      };
      const { data }: { data: ShippingFeeResponse } = await api.post("/api/ship/ghn", payload);

      if (data.code === 200 && data.success) {
        const feeValue = data.data.total ?? 0;
        setFee(feeValue);
        toast.success(`Phí giao hàng dự kiến: ${feeValue.toLocaleString()}đ`);
      } else {
        message.error(data.message || "Không thể tính phí giao hàng. Vui lòng thử lại.");
      }
    } catch {
      message.error("Lỗi khi kết nối dịch vụ vận chuyển.");
    } finally {
      setShipLoading(false);
    }
  };

  const handleCheckout = async () => {
    // Reset errors
    setNameError("");
    setPhoneError("");

    let hasError = false;

    // Validate fullName
    if (!fullName.trim()) {
      setNameError("Vui lòng nhập họ và tên");
      hasError = true;
    }

    // Validate phone
    if (!phone.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại");
      hasError = true;
    } else if (!/^\d{10,11}$/.test(phone.trim())) {
      setPhoneError("Số điện thoại không hợp lệ (10-11 chữ số)");
      hasError = true;
    }

    // Validate address
    if (!addressDetail.trim()) {
      message.warning("Vui lòng nhập địa chỉ cụ thể.");
      hasError = true;
    }

    if (hasError) return;

    if (fee === null) {
      message.warning("Vui lòng tính phí giao hàng trước khi thanh toán.");
      return;
    }

    const districtName = districts.find((d) => d.id === selectedDistrict)?.districtName || "";
    const wardName = wards.find((w) => w.wardCode === selectedWard)?.wardName || "";
    const fullAddress = `${addressDetail}, ${wardName}, ${districtName}`;

    const totalAmount = totalValue;
    const shippingFee = fee;
    const finalAmount = totalValue * (1 - discountPercent / 100) + shippingFee;

    const orderItems: OrderItemPayload[] = cartItems.map((item) => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price || 0,
      totalPrice: (item.price || 0) * item.quantity,
    }));

    const payload = {
      totalAmount,
      discountPercent,
      finalAmount,
      shippingFee,
      deliveryAddress: fullAddress,
      orderItem: orderItems,
      paymentMethod,
      districtName,
      wardName,
      weight: totalWeight,
      shippingMethod: "GHTK",
      receiverName: fullName.trim(),
      phoneNumber: phone.trim(),
    };

    setLoading(true);
    try {
      const { data }: { data: OrderResponse } = await api.post("/api/order", payload);
      if (data.code === 200 || data.code === 201) {
        // dispatch(clearCart());

        if (paymentMethod === "WALLET") {
          window.location.href = "/payment-success";
        } else if (data.data?.paymentUrl) {
          window.location.href = data.data.paymentUrl;
        } else {
          message.error("Không tìm thấy URL thanh toán.");
        }

        return;
      } else {
        message.error(data.message || "Thanh toán thất bại, vui lòng thử lại.");
        return;
      }
    } catch (err) {
      let errMsg = "Đã có lỗi xảy ra.";

      const error = err as AxiosError; // ✔ Không còn báo any vì AxiosError là type cụ thể

      const rawData = error.response?.data;

      // Nếu backend trả về JSON string → parse
      if (typeof rawData === "string") {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed?.message) errMsg = parsed.message;
        } catch {
          // ignore
        }
      }

      // Nếu backend trả object JSON
      else if (typeof rawData === "object" && rawData !== null && "message" in rawData) {
        errMsg = (rawData as { message: string }).message;
      }

      // Nếu axios có lỗi khác
      else if (error.message) {
        errMsg = error.message;
      }

      message.error(errMsg);
      return;
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Thông tin Thanh toán</h1>
        <Row gutter={32} className="checkout-layout">
          {/* Left Column: Form */}
          <Col xs={24} lg={14}>
            <Card className="checkout-card" bordered={false}>
              <h2 className="card-title">Thông tin nhận hàng</h2>
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Họ và tên người nhận hàng"
                      validateStatus={nameError ? "error" : ""}
                      help={nameError}
                    >
                      <Input
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (nameError) setNameError("");
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Số điện thoại người nhận hàng"
                      validateStatus={phoneError ? "error" : ""}
                      help={phoneError}
                    >
                      <Input
                        value={phone}
                        maxLength={11}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setPhone(value);
                          if (phoneError) setPhoneError("");
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Quận / Huyện">
                      <Select
                        placeholder="Chọn quận / huyện"
                        value={selectedDistrict ?? undefined}
                        onChange={handleDistrictChange}
                        options={districts.map((d) => ({ value: d.id, label: d.districtName }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Phường / Xã">
                      <Select
                        placeholder="Chọn phường / xã"
                        value={selectedWard || undefined}
                        onChange={handleWardChange}
                        options={wards.map((w) => ({ value: w.wardCode, label: w.wardName }))}
                        disabled={!selectedDistrict}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Địa chỉ cụ thể">
                  <Input
                    placeholder="Số nhà, tên đường..."
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                  />
                </Form.Item>

                <Button block onClick={handleCalculateFee} loading={shipLoading} className="btn-calculate-fee">
                  {shipLoading ? <Spin size="small" /> : "Tính phí giao hàng"}
                </Button>

                {fee !== null && (
                  <p className="fee-result">
                    Phí giao hàng: <strong>{fee.toLocaleString()}đ</strong>
                  </p>
                )}
              </Form>

              <h2 className="card-title payment-title">Phương thức thanh toán</h2>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="payment-method-group"
              >
                {/* WALLET */}
                <Radio.Button value="WALLET">
                  <div className="payment-option">
                    <img
                      src="https://i.pinimg.com/1200x/b4/9f/f9/b49ff9a83a19ebc745cb4ed40970b6e6.jpg"
                      alt="Wallet"
                      className="payment-logo"
                    />
                  </div>
                </Radio.Button>

                {/* VNPAY */}
                <Radio.Button value="VNPAY">
                  <div className="payment-option">
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1UNDYnwxWITZaRHBqYOeo_7h5vZoJ1qIzbA&s"
                      alt="VNPAY"
                      className="payment-logo"
                    />
                  </div>
                </Radio.Button>

                {/* PAYOS */}
                <Radio.Button value="PAYOS">
                  <div className="payment-option">
                    <img src="https://payos.ai/og-payos-mastercard.png" alt="PAYOS" className="payment-logo" />
                  </div>
                </Radio.Button>
              </Radio.Group>
            </Card>
          </Col>

          {/* Right Column: Summary */}
          <Col xs={24} lg={10}>
            <Card className="checkout-card summary-card" bordered={false}>
              <h2 className="card-title">Tóm tắt đơn hàng</h2>
              <div className="summary-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="summary-item">
                    <div className="summary-item-image">
                      <img src={item.imageUrl} alt={item.name} />
                      <span className="summary-item-quantity">{item.quantity}</span>
                    </div>

                    <div className="summary-info">
                      <p className="summary-item-name">{item.name}</p>
                      <p className="summary-item-price">{(item.price || 0).toLocaleString()}đ</p>
                    </div>

                    <p className="summary-item-total">{((item.price || 0) * item.quantity).toLocaleString()}đ</p>

                    {/* 🔥 NÚT XÓA */}
                    <button className="summary-item-remove" onClick={() => dispatch(removeFromCart(item.id))}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{totalValue.toLocaleString()}đ</span>
                </div>
                <div className="summary-line">
                  <span>Giảm giá thành viên</span>
                  <span>- {discountPercent}%</span>
                </div>
                <div className="summary-line">
                  <span>Phí vận chuyển</span>
                  <span>{fee !== null ? `${fee.toLocaleString()}đ` : "—"}</span>
                </div>
                <div className="summary-line final-total">
                  <h3>Tổng cộng</h3>
                  <h3>{fee !== null ? (totalValue * (1 - discountPercent / 100) + fee).toLocaleString() : "—"} đ</h3>
                </div>
              </div>
              {/* --- Policy Section --- */}
              {orderPolicies.length > 0 && (
                <div className="policy-section">
                  <h3 className="policy-title">Chính sách của hệ thống</h3>

                  <Alert
                    type="info"
                    showIcon
                    message={
                      <ul>
                        {orderPolicies.map((p) => (
                          <li key={p.id}>
                            <strong>{p.policyName}</strong>
                            <br />
                            <span>
                              <b>Phần trăm hoàn tiền:</b> {p.refundPercentage}% &nbsp;|&nbsp;
                              <b>Thời gian yêu cầu hoàn:</b> {p.timesBeforeCheckin}h sau khi đặt hàng
                            </span>
                          </li>
                        ))}
                      </ul>
                    }
                  />

                  <Checkbox checked={policyChecked} onChange={(e) => setPolicyChecked(e.target.checked)}>
                    Tôi đã đọc và đồng ý với chính sách hoàn tiền sản phẩm
                  </Checkbox>
                </div>
              )}

              <Button
                type="primary"
                block
                onClick={handleCheckout}
                loading={loading}
                disabled={fee === null || (orderPolicies.length > 0 && !policyChecked)}
                className="btn-checkout"
              >
                {loading ? "Đang xử lý..." : "Thanh toán"}
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Checkout;
