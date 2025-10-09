import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, Input, Button, Radio, message, Spin, Row, Col } from "antd";
import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";
import { clearCart } from "../../../redux/features/cartSlice";
import api from "../../../config/axios";
import "./Checkout.scss";

interface RootState {
  user: { fullName: string; role: string } | null;
  cart: {
    items: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      stockQuantity: number;
      imageUrl: string;
      weight: number;
    }[];
  };
}

interface ShippingFeeResponse {
  success: boolean;
  fee: {
    name: string;
    fee: number;
    insurance_fee: number;
  };
}

interface MembershipResponse {
  code: number;
  data: {
    discountPercent: number;
    rankName: string;
    currentPoint: number;
  };
}

interface OrderResponse {
  code: number;
  message: string;
  data: { paymentUrl: string };
}

const Checkout = () => {
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);

  const [address, setAddress] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [province] = useState<string>("Hồ Chí Minh");
  const [fee, setFee] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "PAYOS">("VNPAY");
  const [loading, setLoading] = useState(false);
  const [shipLoading, setShipLoading] = useState(false);

  const inputRef = useRef<google.maps.places.SearchBox | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyAwSwTDdF00hbh21k7LsX-4Htuwqm9MlPg",
    libraries: ["places"],
  });

  const totalWeight = cartItems.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const totalValue = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => {
    document.title = "Thanh toán";
    fetchMembership();
  }, []);

  const fetchMembership = async () => {
    try {
      const { data }: { data: MembershipResponse } = await api.get("/api/membership");
      setDiscountPercent(data.data.discountPercent || 0);
    } catch {
      message.warning("Không thể tải thông tin hạng thành viên");
    }
  };

  const handleAddressChange = async () => {
    if (!address) return;
    await calculateShippingFee(address);
  };

  const calculateShippingFee = async (addr: string) => {
    if (!district) return;
    setShipLoading(true);
    try {
      const payload = {
        address: addr,
        province: province,
        district: district,
        pickAddress: "643 Điện Biên Phủ, Phường 1, Quận 3, TP Hồ Chí Minh",
        pickProvince: "TP Hồ Chí Minh",
        pickDistrict: "Quận 3",
        weight: totalWeight,
        value: totalValue,
      };

      // ✅ Vẫn gọi API nội bộ /api/ship
      const { data }: { data: ShippingFeeResponse } = await api.post("/api/ship", payload);

      if (data.success) {
        setFee(data.fee.fee);
        message.success("Tính phí giao hàng thành công!");
      } else {
        message.error("Không thể tính phí giao hàng.");
      }
    } catch (err) {
      message.error("Lỗi khi gọi API tính phí vận chuyển.");
    } finally {
      setShipLoading(false);
    }
  };

  const handlePlaceChange = () => {
    if (!inputRef.current) return;
    const places = inputRef.current.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    if (!place.formatted_address || !place.address_components) return;

    setAddress(place.formatted_address);

    const districtComp = place.address_components.find((c) => c.types.includes("administrative_area_level_2"));
    const districtName = districtComp?.long_name || "";
    setDistrict(districtName);

    calculateShippingFee(place.formatted_address);
  };

  const handleCheckout = async () => {
    if (!fee) {
      message.warning("Chưa tính được phí giao hàng!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        totalAmount: totalValue,
        discountPercent,
        shippingFee: fee,
        deliveryAddress: address,
        orderItem: cartItems.map((i) => ({
          productId: i.id,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          totalPrice: i.price * i.quantity,
        })),
        paymentMethod,
      };
      const { data }: { data: OrderResponse } = await api.post("/api/order", payload);
      if (data.code === 200 && data.data.paymentUrl) {
        dispatch(clearCart());
        setTimeout(() => {
          window.location.href = data.data.paymentUrl;
        }, 200);
      } else message.error(data.message);
    } catch {
      message.error("Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Thanh toán đơn hàng</h1>

      <Row gutter={24} justify="center" className="checkout-layout">
        <Col xs={24} md={14}>
          <Card className="checkout-card">
            <h2>Địa chỉ giao hàng</h2>
            {isLoaded ? (
              <StandaloneSearchBox onLoad={(ref) => (inputRef.current = ref)} onPlacesChanged={handlePlaceChange}>
                <Input
                  value={address}
                  placeholder="Nhập địa chỉ giao hàng..."
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={handleAddressChange}
                />
              </StandaloneSearchBox>
            ) : (
              <Input placeholder="Đang tải Google Maps..." disabled />
            )}
            {shipLoading ? (
              <Spin style={{ marginTop: 10 }} />
            ) : (
              fee !== null && <p className="fee-result">Phí giao hàng: {fee.toLocaleString()}đ</p>
            )}

            <h2 style={{ marginTop: 20 }}>Phương thức thanh toán</h2>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="payment-method"
            >
              <Radio value="VNPAY">
                <img src="https://sandbox.vnpayment.vn/paymentv2/images/icons/vnpay.png" alt="vnpay" />
                VNPAY
              </Radio>
              <Radio value="PAYOS">
                <img src="https://static.payos.vn/img/logo.svg" alt="payos" />
                PAYOS
              </Radio>
            </Radio.Group>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card className="checkout-card summary-card">
            <h2>Tóm tắt đơn hàng</h2>
            {cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img src={item.imageUrl} alt={item.name} />
                <div className="summary-info">
                  <p>{item.name}</p>
                  <p>
                    {item.quantity} × {item.price.toLocaleString()}đ
                  </p>
                </div>
              </div>
            ))}

            <div className="summary-total">
              <p>Tạm tính: {totalValue.toLocaleString()}đ</p>
              <p>Giảm giá: {discountPercent}%</p>
              <p>Phí ship: {fee ? `${fee.toLocaleString()}đ` : "Chưa có"}</p>
              <h3>Tổng cộng: {fee ? (totalValue * (1 - discountPercent / 100) + fee).toLocaleString() : "—"} đ</h3>
            </div>

            <Button
              type="primary"
              block
              onClick={handleCheckout}
              loading={loading}
              disabled={!fee}
              className="btn-checkout"
            >
              Thanh toán
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout;
