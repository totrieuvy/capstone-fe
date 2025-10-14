// import { Card, Row, Col, Alert, DatePicker, Statistic, Spin, Drawer, Button } from "antd";
// import { HomeOutlined } from "@ant-design/icons";
// import dayjs, { Dayjs } from "dayjs";
// import type { DailyAvailability } from "../../../services/BoardingService";

// const { RangePicker } = DatePicker;

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

// interface SelectCageDatesProps {
//   cageTypes: CageType[];
//   additionalServices: AdditionalService[];
//   selectedCageId: string | null;
//   dateRange: [Dayjs | null, Dayjs | null];
//   cageSelectionStep: number;
//   availability: DailyAvailability[];
//   loadingAvailability: boolean;
//   selectedServiceIds: string[];
//   drawerVisible: boolean;
//   drawerCage: CageType | null;
//   onSelectCage: (cageId: string) => void;
//   onDateChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
//   onToggleService: (serviceId: string) => void;
//   onCageClick: (cage: CageType) => void;
//   onDrawerClose: () => void;
// }

// function SelectCageDates({
//   cageTypes,
//   additionalServices,
//   selectedCageId,
//   dateRange,
//   cageSelectionStep,
//   availability,
//   loadingAvailability,
//   selectedServiceIds,
//   drawerVisible,
//   drawerCage,
//   onSelectCage,
//   onDateChange,
//   onToggleService,
//   onCageClick,
//   onDrawerClose,
// }: SelectCageDatesProps) {
  
//   const calculateTotalDays = (): number => {
//     if (!dateRange[0] || !dateRange[1]) return 0;
//     return dateRange[1].diff(dateRange[0], "day") + 1;
//   };

//   const calculateDiscount = (days: number): number => {
//     if (days >= 30) return 20;
//     if (days >= 14) return 15;
//     if (days >= 7) return 10;
//     if (days >= 3) return 5;
//     return 0;
//   };

//   const renderAvailabilityInfo = () => {
//     if (availability.length === 0) return null;

//     const unavailableDays = availability.filter(day => !day.isAvailable);
//     const hasUnavailableDays = unavailableDays.length > 0;
    
//     const totalDaysInRange = availability.length;
//     const availableDaysCount = availability.filter(day => day.isAvailable).length;
//     const avgAvailableCages = Math.round(
//       availability.reduce((sum, day) => sum + day.availableCages, 0) / totalDaysInRange
//     );

//     return (
//       <div style={{ marginTop: 24 }}>
//         <h4 style={{ color: "#ff6f61", marginBottom: 16 }}>📊 Tình trạng chuồng trong khoảng thời gian đã chọn</h4>
        
//         <Row gutter={16} style={{ marginBottom: 16 }}>
//           <Col xs={24} sm={6}>
//             <Card size="small" style={{ textAlign: "center" }}>
//               <Statistic
//                 title="Tổng số ngày"
//                 value={totalDaysInRange}
//                 valueStyle={{ color: "#1890ff", fontSize: 20 }}
//                 suffix="ngày"
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={6}>
//             <Card size="small" style={{ textAlign: "center" }}>
//               <Statistic
//                 title="Ngày khả dụng"
//                 value={availableDaysCount}
//                 valueStyle={{ color: "#52c41a", fontSize: 20 }}
//                 suffix={`/${totalDaysInRange}`}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={6}>
//             <Card size="small" style={{ textAlign: "center" }}>
//               <Statistic
//                 title="Chuồng trống (TB)"
//                 value={avgAvailableCages}
//                 valueStyle={{ color: "#722ed1", fontSize: 20 }}
//                 suffix="chuồng"
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={6}>
//             <Card size="small" style={{ textAlign: "center" }}>
//               <Statistic
//                 title="Tình trạng"
//                 value={hasUnavailableDays ? "Có hạn chế" : "Tốt"}
//                 valueStyle={{ 
//                   color: hasUnavailableDays ? "#ff4d4f" : "#52c41a", 
//                   fontSize: 16 
//                 }}
//               />
//             </Card>
//           </Col>
//         </Row>

//         {hasUnavailableDays && (
//           <Alert
//             message="⚠ Một số ngày không khả dụng"
//             description={`Có ${unavailableDays.length} ngày trong khoảng thời gian bạn chọn không có chuồng trống. Vui lòng xem chi tiết bên dưới và cân nhắc chọn ngày khác.`}
//             type="warning"
//             showIcon
//             style={{ marginBottom: 16 }}
//           />
//         )}

//         <Card 
//           title="Chi tiết tình trạng theo ngày" 
//           size="small"
//           headStyle={{ background: "#fafafa", color: "#ff6f61" }}
//         >
//           <div style={{ maxHeight: 300, overflowY: "auto" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#f5f5f5" }}>
//                   <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #d9d9d9" }}>
//                     Ngày
//                   </th>
//                   <th style={{ padding: "8px 12px", textAlign: "center", border: "1px solid #d9d9d9" }}>
//                     Chuồng đã đặt
//                   </th>
//                   <th style={{ padding: "8px 12px", textAlign: "center", border: "1px solid #d9d9d9" }}>
//                     Chuồng còn trống
//                   </th>
//                   <th style={{ padding: "8px 12px", textAlign: "center", border: "1px solid #d9d9d9" }}>
//                     Trạng thái
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {availability.map((day, index) => (
//                   <tr 
//                     key={day.date}
//                     style={{ 
//                       background: index % 2 === 0 ? "#fafafa" : "white",
//                       borderBottom: "1px solid #d9d9d9"
//                     }}
//                   >
//                     <td style={{ padding: "8px 12px", border: "1px solid #d9d9d9", fontWeight: 500 }}>
//                       {dayjs(day.date).format("DD/MM/YYYY")}
//                       <div style={{ fontSize: 12, color: "#666" }}>
//                         {dayjs(day.date).format("dddd")}
//                       </div>
//                     </td>
//                     <td style={{ 
//                       padding: "8px 12px", 
//                       textAlign: "center", 
//                       border: "1px solid #d9d9d9",
//                       color: "#fa8c16",
//                       fontWeight: 600
//                     }}>
//                       {day.bookedCages}
//                     </td>
//                     <td style={{ 
//                       padding: "8px 12px", 
//                       textAlign: "center", 
//                       border: "1px solid #d9d9d9",
//                       color: day.availableCages > 0 ? "#52c41a" : "#ff4d4f",
//                       fontWeight: 600
//                     }}>
//                       {day.availableCages}
//                     </td>
//                     <td style={{ 
//                       padding: "8px 12px", 
//                       textAlign: "center", 
//                       border: "1px solid #d9d9d9"
//                     }}>
//                       <span style={{
//                         padding: "2px 8px",
//                         borderRadius: 4,
//                         fontSize: 12,
//                         fontWeight: 600,
//                         background: day.isAvailable ? "#f6ffed" : "#fff2e8",
//                         color: day.isAvailable ? "#52c41a" : "#fa8c16",
//                         border: `1px solid ${day.isAvailable ? "#b7eb8f" : "#ffbb96"}`
//                       }}>
//                         {day.isAvailable ? "✓ Khả dụng" : "✗ Hết chỗ"}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Card>

//         {!hasUnavailableDays && (
//           <Alert
//             message="✓ Bạn có thể tiếp tục đặt phòng cho hamster trong khoảng thời gian này."
//             type="success"
//             showIcon
//             style={{ marginTop: 16 }}
//           />
//         )}
//       </div>
//     );
//   };

//   const totalDays = calculateTotalDays();
//   const discount = calculateDiscount(totalDays);

//   return (
//     <div className="step-select-cage-and-dates">
//       {cageSelectionStep === 0 ? (
//         <div className="cage-selection-substep">
//           <h3 style={{ color: "#ff6f61", marginBottom: 24, fontSize: 20 }}>
//             🏠 Chọn Loại Chuồng
//           </h3>
          
//           <Alert
//             message="Bước 1: Chọn loại chuồng"
//             description="Vui lòng chọn loại chuồng phù hợp cho hamster của bạn. Sau khi chọn, bạn sẽ có thể xem tình trạng khả dụng và chọn ngày gửi."
//             type="info"
//             showIcon
//             style={{ marginBottom: 24 }}
//           />

//           <Row gutter={[24, 24]}>
//             {cageTypes.map((cage) => (
//               <Col xs={24} sm={12} md={6} key={cage.id}>
//                 <Card
//                   hoverable
//                   className={`cage__card ${selectedCageId === cage.id ? "selected" : ""}`}
//                   onClick={() => onCageClick(cage)}
//                   style={{
//                     borderRadius: 12,
//                     border:
//                       selectedCageId === cage.id
//                         ? "3px solid #ff6f61"
//                         : "1px solid #f0f0f0",
//                     cursor: "pointer",
//                     position: "relative",
//                   }}
//                 >
//                   <div style={{ textAlign: "center" }}>
//                     <HomeOutlined
//                       style={{ fontSize: 48, color: "#ff6f61", marginBottom: 12 }}
//                     />
//                     <h4 style={{ fontSize: 18, fontWeight: 700, color: "#ff6f61", marginBottom: 8 }}>
//                       {cage.typeName}
//                     </h4>
//                     <p style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "8px 0" }}>
//                       {cage.pricePerDay.toLocaleString("vi-VN")} đ/ngày
//                     </p>
//                     <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
//                       Kích thước: {cage.size}
//                     </p>
//                   </div>
//                   {selectedCageId === cage.id && (
//                     <div className="selected-checkmark">✓</div>
//                   )}
//                 </Card>
//               </Col>
//             ))}
//           </Row>

//           {selectedCageId && (
//             <Alert
//               message="Đã chọn loại chuồng"
//               description="Nhấn 'Tiếp theo' để chọn ngày gửi và xem tình trạng khả dụng của chuồng."
//               type="success"
//               showIcon
//               style={{ marginTop: 24 }}
//             />
//           )}
//         </div>
//       ) : (
//         <div className="date-selection-substep">
//           <h3 style={{ color: "#ff6f61", marginBottom: 16, fontSize: 20 }}>
//             📅 Chọn Ngày Gửi và Nhận
//           </h3>

//           {selectedCageId && (
//             <Card style={{ marginBottom: 24, background: "#f9f9f9" }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                 <HomeOutlined style={{ fontSize: 24, color: "#ff6f61" }} />
//                 <div>
//                   <h4 style={{ margin: 0, color: "#ff6f61" }}>
//                     Đã chọn: {cageTypes.find(c => c.id === selectedCageId)?.typeName}
//                   </h4>
//                   <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
//                     {cageTypes.find(c => c.id === selectedCageId)?.pricePerDay.toLocaleString("vi-VN")} đ/ngày
//                   </p>
//                 </div>
//               </div>
//             </Card>
//           )}

//           <Alert
//             message="Ưu đãi theo thời gian gửi thú"
//             description={
//               <ul style={{ margin: 0, paddingLeft: 20 }}>
//                 <li>Từ 3-6 ngày: Giảm 5% tổng hóa đơn</li>
//                 <li>Từ 7-13 ngày: Giảm 10% tổng hóa đơn</li>
//                 <li>Từ 14-29 ngày: Giảm 15% tổng hóa đơn</li>
//                 <li>Từ 30 ngày trở lên: Giảm 20% tổng hóa đơn</li>
//               </ul>
//             }
//             type="success"
//             showIcon
//             style={{ marginBottom: 16 }}
//           />

//           <Alert
//             message="Phụ thu ngày lễ"
//             description="Các ngày lễ, Tết sẽ có phụ thu 20% trên giá dịch vụ hàng ngày"
//             type="warning"
//             showIcon
//             style={{ marginBottom: 24 }}
//           />

//           <div style={{ marginBottom: 24 }}>
//             <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
//               Chọn ngày gửi và nhận hamster:
//             </label>
//             <Spin spinning={loadingAvailability} tip="Đang kiểm tra tình trạng chuồng...">
//               <RangePicker
//                 style={{ width: "100%", borderRadius: 8 }}
//                 format="DD-MM-YYYY"
//                 placeholder={["Ngày gửi", "Ngày nhận"]}
//                 onChange={onDateChange}
//                 value={dateRange}
//                 disabledDate={(current) => current && current < dayjs().startOf("day")}
//               />
//             </Spin>
//           </div>

//           {totalDays > 0 && (
//             <Row gutter={16} style={{ marginBottom: 24 }}>
//               <Col span={12}>
//                 <Card style={{ textAlign: "center", borderRadius: 8 }}>
//                   <Statistic
//                     title="Tổng số ngày"
//                     value={totalDays}
//                     suffix="ngày"
//                     valueStyle={{ color: "#ff6f61" }}
//                   />
//                 </Card>
//               </Col>
//               <Col span={12}>
//                 <Card style={{ textAlign: "center", borderRadius: 8 }}>
//                   <Statistic
//                     title="Giảm giá"
//                     value={discount}
//                     suffix="%"
//                     valueStyle={{ color: "#52c41a" }}
//                   />
//                 </Card>
//               </Col>
//             </Row>
//           )}

//           {renderAvailabilityInfo()}

//           <div className="services-section" style={{ marginTop: 40 }}>
//             <h3 style={{ color: "#ff6f61", marginBottom: 8, fontSize: 20 }}>
//               ✨ Dịch Vụ Bổ Sung (Tùy chọn)
//             </h3>
//             <p style={{ color: "#999", marginBottom: 24, fontSize: 14 }}>
//               Chọn các dịch vụ bổ sung để chăm sóc hamster tốt hơn
//             </p>

//             <Row gutter={[16, 16]}>
//               {additionalServices.map((service) => (
//                 <Col xs={24} sm={12} md={8} key={service.id}>
//                   <Card
//                     hoverable
//                     className={`service__card ${
//                       selectedServiceIds.includes(service.id) ? "selected" : ""
//                     }`}
//                     onClick={() => onToggleService(service.id)}
//                     style={{
//                       borderRadius: 12,
//                       border: selectedServiceIds.includes(service.id)
//                         ? "2px solid #ff6f61"
//                         : "1px solid #f0f0f0",
//                       cursor: "pointer",
//                       position: "relative",
//                       height: "100%",
//                     }}
//                   >
//                     <div>
//                       <h4
//                         style={{
//                           fontSize: 16,
//                           fontWeight: 700,
//                           color: "#ff6f61",
//                           marginBottom: 8,
//                         }}
//                       >
//                         {service.name}
//                       </h4>
//                       <p
//                         style={{
//                           fontSize: 14,
//                           color: "#666",
//                           marginBottom: 12,
//                           minHeight: 40,
//                         }}
//                       >
//                         {service.description}
//                       </p>
//                       <p
//                         style={{
//                           fontSize: 16,
//                           fontWeight: 600,
//                           color: "#333",
//                           margin: 0,
//                         }}
//                       >
//                         {service.pricePerDay.toLocaleString("vi-VN")} đ/ngày
//                       </p>
//                     </div>
//                     {selectedServiceIds.includes(service.id) && (
//                       <div className="selected-checkmark">✓</div>
//                     )}
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           </div>
//         </div>
//       )}

//       <Drawer
//         title={
//           <span style={{ fontSize: 20, color: "#ff6f61", fontWeight: 700 }}>
//             {drawerCage?.typeName}
//           </span>
//         }
//         placement="right"
//         onClose={onDrawerClose}
//         open={drawerVisible}
//         width={500}
//       >
//         {drawerCage && (
//           <div className="cage-details">
//             <img
//               src={drawerCage.image}
//               alt={drawerCage.typeName}
//               style={{
//                 width: "100%",
//                 height: 250,
//                 objectFit: "cover",
//                 borderRadius: 8,
//                 marginBottom: 24,
//               }}
//             />

//             <div style={{ marginBottom: 24 }}>
//               <h4 style={{ color: "#ff6f61", marginBottom: 8 }}>Giá thuê:</h4>
//               <p style={{ fontSize: 24, fontWeight: 700, color: "#333", margin: 0 }}>
//                 {drawerCage.pricePerDay.toLocaleString("vi-VN")} đ/ngày
//               </p>
//             </div>

//             <div style={{ marginBottom: 24 }}>
//               <h4 style={{ color: "#ff6f61", marginBottom: 8 }}>Kích thước:</h4>
//               <p style={{ fontSize: 16, color: "#666", margin: 0 }}>{drawerCage.size}</p>
//             </div>

//             <div style={{ marginBottom: 32 }}>
//               <h4 style={{ color: "#ff6f61", marginBottom: 8 }}>Mô tả:</h4>
//               <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, margin: 0 }}>
//                 {drawerCage.description}
//               </p>
//             </div>

//             <Button
//               type="primary"
//               size="large"
//               block
//               onClick={() => onSelectCage(drawerCage.id)}
//               style={{
//                 background: "linear-gradient(45deg, #ff6f61, #ffcc5c)",
//                 border: "none",
//                 borderRadius: 8,
//                 height: 48,
//                 fontSize: 16,
//                 fontWeight: 600,
//               }}
//             >
//               Chọn loại chuồng này
//             </Button>
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// }

// export default SelectCageDates;