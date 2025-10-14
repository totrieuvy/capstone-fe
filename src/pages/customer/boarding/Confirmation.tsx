// import { Card, Row, Col, Divider, Image, Alert, Checkbox, Spin } from "antd";
// import { Dayjs } from "dayjs";
// import type { CalculateBookingCostResponse } from "../../../services/BoardingService";
// import type { CustomerProfile } from "../../../services/CustomerService";

// interface HamsterProfile {
//   id: string;
//   name: string;
//   color: string;
//   dob: string;
//   species: string;
//   gender: "Male" | "Female";
//   weight: number;
//   profilePicture: string;
//   healthNote: string;
// }

// interface CageType {
//   id: string;
//   typeName: string;
//   description: string;
//   pricePerDay: number;
//   size: string;
//   image: string;
//   material?: string;
//   isActive?: boolean;
// }

// interface AdditionalService {
//   id: string;
//   name: string;
//   description: string;
//   pricePerDay: number;
// }

// interface ConfirmationProps {
//   selectedHamster: HamsterProfile | undefined;
//   selectedCage: CageType | undefined;
//   selectedServices: AdditionalService[];
//   dateRange: [Dayjs | null, Dayjs | null];
//   totalDays: number;
//   discount: number;
//   customerProfile: CustomerProfile | null;
//   bookingCostData: CalculateBookingCostResponse | null;
//   loadingCostCalculation: boolean;
//   termsAccepted: boolean;
//   onTermsChange: (accepted: boolean) => void;
// }

// function Confirmation({
//   selectedHamster,
//   selectedCage,
//   selectedServices,
//   dateRange,
//   totalDays,
//   discount,
//   customerProfile,
//   bookingCostData,
//   loadingCostCalculation,
//   termsAccepted,
//   onTermsChange,
// }: ConfirmationProps) {
  
//   // Calculate pricing - Use API data if available, otherwise fallback to local calculations
//   const cageTotal = bookingCostData ? bookingCostData.cagePrice : (selectedCage ? selectedCage.pricePerDay * totalDays : 0);
//   const servicesTotal = bookingCostData ? bookingCostData.servicesPrice : selectedServices.reduce(
//     (sum, service) => sum + service.pricePerDay * totalDays,
//     0
//   );
//   const holidayTotal = bookingCostData ? bookingCostData.holidayPrice : 0;
//   const subtotal = bookingCostData ? (bookingCostData.cagePrice + bookingCostData.servicesPrice) : (cageTotal + servicesTotal);
//   const discountAmount = bookingCostData ? (subtotal - bookingCostData.totalAmount) : ((subtotal * discount) / 100);
//   const finalTotal = bookingCostData ? bookingCostData.totalAmount : (subtotal - discountAmount);

//   return (
//     <div className="step-confirmation">
//       <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
//         ✅ Xác Nhận Đặt Phòng
//       </h3>

//       {/* Owner and Hamster Info Section */}
//       <Card
//         title={
//           <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
//             👤 Thông Tin Chủ Nhân & Hamster
//           </span>
//         }
//         style={{ marginBottom: 24, borderRadius: 12 }}
//       >
//         <Row gutter={[24, 24]}>
//           <Col xs={24} md={12}>
//             <div className="info-group">
//               <h4 style={{ color: "#ff6f61", marginBottom: 12 }}>Thông tin chủ nhân:</h4>
//               {customerProfile ? (
//                 <>
//                   <p><strong>Họ tên:</strong> {customerProfile.fullName}</p>
//                   <p><strong>Email:</strong> {customerProfile.email}</p>
//                   <p><strong>Số điện thoại:</strong> {customerProfile.phone}</p>
//                   <p><strong>Hạng thành viên:</strong> 
//                     <span style={{ 
//                       color: customerProfile.rank === 'PLATINUM' ? '#722ed1' : 
//                              customerProfile.rank === 'GOLD' ? '#faad14' :
//                              customerProfile.rank === 'SILVER' ? '#52c41a' : '#1890ff',
//                       fontWeight: 600,
//                       marginLeft: 8
//                     }}>
//                       {customerProfile.rank}
//                     </span>
//                   </p>
//                   <p><strong>Điểm tích lũy:</strong> {customerProfile.currentPoint} điểm</p>
//                 </>
//               ) : (
//                 <p>Đang tải thông tin khách hàng...</p>
//               )}
//             </div>
//           </Col>
//           <Col xs={24} md={12}>
//             {selectedHamster && (
//               <div className="info-group">
//                 <h4 style={{ color: "#ff6f61", marginBottom: 12 }}>Thông tin hamster:</h4>
//                 <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
//                   <div style={{ flexShrink: 0 }}>
//                     <Image
//                       src={selectedHamster.profilePicture}
//                       alt={selectedHamster.name}
//                       width={120}
//                       height={120}
//                       style={{ 
//                         borderRadius: 12, 
//                         objectFit: "cover",
//                         border: "2px solid #ff6f61"
//                       }}
//                       placeholder={
//                         <div style={{
//                           width: 120,
//                           height: 120,
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           background: "#f5f5f5",
//                           borderRadius: 12,
//                           color: "#ccc"
//                         }}>
//                           🐹
//                         </div>
//                       }
//                     />
//                   </div>
//                   <div style={{ flex: 1 }}>
//                     <p><strong>Tên:</strong> {selectedHamster.name}</p>
//                     <p><strong>Loài:</strong> {selectedHamster.species}</p>
//                     <p><strong>Giới tính:</strong> {selectedHamster.gender}</p>
//                     <p><strong>Cân nặng:</strong> {selectedHamster.weight}g</p>
//                     <p><strong>Ngày sinh:</strong> {selectedHamster.dob}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </Col>
//         </Row>
//       </Card>

//       {/* Service Info Section */}
//       <Card
//         title={
//           <span style={{ color: "#ff6f61", fontSize: 18, fontWeight: 600 }}>
//             📋 Thông Tin Dịch Vụ
//           </span>
//         }
//         style={{ marginBottom: 24, borderRadius: 12 }}
//       >
//         <Row gutter={[24, 24]}>
//           {/* Left Column - Services Detail */}
//           <Col xs={24} md={12}>
//             <div className="service-details">
//               <h4 style={{ color: "#ff6f61", marginBottom: 16 }}>Dịch vụ đã chọn:</h4>
              
//               {/* Booking Dates */}
//               <div style={{ marginBottom: 20 }}>
//                 <p style={{ marginBottom: 4 }}>
//                   <strong>📅 Ngày gửi:</strong> {dateRange[0]?.format("DD-MM-YYYY")}
//                 </p>
//                 <p style={{ marginBottom: 4 }}>
//                   <strong>📅 Ngày nhận:</strong> {dateRange[1]?.format("DD-MM-YYYY")}
//                 </p>
//                 <p>
//                   <strong>⏱️ Tổng số ngày:</strong> {totalDays} ngày
//                 </p>
//               </div>

//               <Divider style={{ margin: "16px 0" }} />

//               {/* Cage Type with Image */}
//               {selectedCage && (
//                 <div style={{ marginBottom: 20 }}>
//                   <h4 style={{ color: "#333", marginBottom: 12 }}>🏠 Loại chuồng:</h4>
//                   <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
//                     <Image
//                       src={selectedCage.image}
//                       alt={selectedCage.typeName}
//                       width={100}
//                       height={100}
//                       style={{ borderRadius: 8, objectFit: "cover" }}
//                     />
//                     <div>
//                       <p style={{ fontWeight: 600, marginBottom: 4 }}>
//                         {selectedCage.typeName}
//                       </p>
//                       <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
//                         {selectedCage.size}
//                       </p>
//                       <p style={{ fontSize: 14, color: "#333" }}>
//                         {selectedCage.pricePerDay.toLocaleString("vi-VN")} đ/ngày
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Additional Services */}
//               {selectedServices.length > 0 && (
//                 <>
//                   <Divider style={{ margin: "16px 0" }} />
//                   <div>
//                     <h4 style={{ color: "#333", marginBottom: 12 }}>✨ Dịch vụ bổ sung:</h4>
//                     {selectedServices.map((service) => (
//                       <div key={service.id} style={{ marginBottom: 12 }}>
//                         <p style={{ fontWeight: 600, marginBottom: 2 }}>
//                           • {service.name}
//                         </p>
//                         <p style={{ fontSize: 13, color: "#666", marginLeft: 12 }}>
//                           {service.pricePerDay.toLocaleString("vi-VN")} đ/ngày
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//           </Col>

//           {/* Right Column - Price Breakdown */}
//           <Col xs={24} md={12}>
//             <Spin spinning={loadingCostCalculation} tip="Đang tính toán chi phí...">
//               <div className="price-breakdown">
//                 <h4 style={{ color: "#ff6f61", marginBottom: 16 }}>💰 Chi Tiết Giá:</h4>
                
//                 <div className="price-item">
//                   <span>Tiền chuồng ({totalDays} ngày):</span>
//                   <span>{cageTotal.toLocaleString("vi-VN")} đ</span>
//                 </div>

//                 {selectedServices.length > 0 && (
//                   <div className="price-item">
//                     <span>Dịch vụ bổ sung ({totalDays} ngày):</span>
//                     <span>{servicesTotal.toLocaleString("vi-VN")} đ</span>
//                   </div>
//                 )}

//                 {holidayTotal > 0 && (
//                   <div className="price-item" style={{ color: "#fa8c16" }}>
//                     <span>Phụ thu ngày lễ:</span>
//                     <span>{holidayTotal.toLocaleString("vi-VN")} đ</span>
//                   </div>
//                 )}

//                 <Divider style={{ margin: "12px 0" }} />

//                 <div className="price-item">
//                   <span>Tạm tính:</span>
//                   <span style={{ fontWeight: 600 }}>
//                     {subtotal.toLocaleString("vi-VN")} đ
//                   </span>
//                 </div>

//                 {discountAmount > 0 && (
//                   <div className="price-item" style={{ color: "#52c41a" }}>
//                     <span>
//                       Giảm giá {bookingCostData ? 
//                         `(${((discountAmount / subtotal) * 100).toFixed(0)}%)` : 
//                         `(${discount}%)`
//                       }:
//                     </span>
//                     <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
//                   </div>
//                 )}

//                 <Divider style={{ margin: "12px 0" }} />

//                 <div className="price-item total">
//                   <span>Tổng cộng:</span>
//                   <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
//                 </div>
//               </div>
//             </Spin>
//           </Col>
//         </Row>
//       </Card>

//       {/* Membership Status Alert */}
//       {!customerProfile && (
//         <Alert
//           message="Đang tải thông tin thành viên"
//           description="Vui lòng đợi trong khi chúng tôi tải thông tin thành viên của bạn..."
//           type="info"
//           showIcon
//           style={{ marginBottom: 24 }}
//         />
//       )}

//       {customerProfile && (!customerProfile.rank || !customerProfile.currentPoint) && (
//         <Alert
//           message="Thông tin thành viên không đầy đủ"
//           description="Thông tin thành viên của bạn chưa đầy đủ. Vui lòng liên hệ hỗ trợ để hoàn tất thông tin trước khi đặt phòng."
//           type="warning"
//           showIcon
//           style={{ marginBottom: 24 }}
//         />
//       )}

//       {/* Terms of Service Section */}
//       <Card
//         style={{
//           marginBottom: 24,
//           borderRadius: 12,
//           background: "linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%)",
//         }}
//       >
//         <div className="terms-section">
//           <h4 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 16 }}>
//             📜 Điều Khoản Dịch Vụ
//           </h4>
//           <div
//             style={{
//               background: "white",
//               padding: 16,
//               borderRadius: 8,
//               marginBottom: 16,
//               maxHeight: 200,
//               overflowY: "auto",
//               border: "1px solid #f0f0f0",
//             }}
//           >
//             <p style={{ marginBottom: 12, fontSize: 14 }}>
//               <strong>1. Chăm sóc hamster:</strong> Chúng tôi cam kết chăm sóc hamster của bạn 
//               với sự tận tâm và chuyên nghiệp nhất. Hamster sẽ được cho ăn đầy đủ, vệ sinh 
//               chuồng hàng ngày và được theo dõi sức khỏe thường xuyên.
//             </p>
//             <p style={{ marginBottom: 12, fontSize: 14 }}>
//               <strong>2. Trách nhiệm của khách hàng:</strong> Vui lòng cung cấp đầy đủ 
//               thông tin về tình trạng sức khỏe, thói quen ăn uống và các lưu ý đặc biệt của 
//               hamster. Khách hàng cần đưa hamster đến và đón hamster đúng giờ đã hẹn.
//             </p>
//             <p style={{ marginBottom: 12, fontSize: 14 }}>
//               <strong>3. Chính sách hủy đặt phòng:</strong> Hủy trước 48 giờ: Hoàn 100% tiền. 
//               Hủy trước 24 giờ: Hoàn 50% tiền. Hủy trong vòng 24 giờ: Không hoàn tiền.
//             </p>
//             <p style={{ marginBottom: 0, fontSize: 14 }}>
//               <strong>4. Chính sách khẩn cấp:</strong> Trong trường hợp hamster có vấn đề về 
//               sức khỏe, chúng tôi sẽ liên hệ ngay với bạn và đưa hamster đến bác sĩ thú y nếu 
//               cần thiết. Chi phí y tế sẽ do khách hàng chi trả.
//             </p>
//           </div>
          
//           <Checkbox
//             checked={termsAccepted}
//             onChange={(e) => onTermsChange(e.target.checked)}
//             style={{ fontSize: 15 }}
//           >
//             <span style={{ color: "#333", fontWeight: 500 }}>
//               Tôi đã đọc và đồng ý với các điều khoản dịch vụ
//             </span>
//           </Checkbox>
//         </div>
//       </Card>
//     </div>
//   );
// }

// export default Confirmation;