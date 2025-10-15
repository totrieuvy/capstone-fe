import  { useState } from 'react';
import { Card } from 'antd';
import './BoardingSchedule.scss';

interface Booking {
  id: string;
  cageId: string;
  cageType: 'Cơ bản' | 'Tiêu chuẩn' | 'Đầy đủ' | 'Vip';
  startDate: number;
  endDate: number;
  customerName: string;
  hamsterName: string;
}

const BoardingSchedule = () => {
  const cagesByType = {
    'Cơ bản': ['CB-001', 'CB-002', 'CB-003'],
    'Tiêu chuẩn': ['TC-001', 'TC-002', 'TC-003'],
    'Đầy đủ': ['DD-001', 'DD-002', 'DD-003'],
    'Vip': ['VIP-001', 'VIP-002', 'VIP-003']
  };

  // const allCages = [
  //   ...cagesByType['Cơ bản'].map(id => ({ id, type: 'Cơ bản' as const })),
  //   ...cagesByType['Tiêu chuẩn'].map(id => ({ id, type: 'Tiêu chuẩn' as const })),
  //   ...cagesByType['Đầy đủ'].map(id => ({ id, type: 'Đầy đủ' as const })),
  //   ...cagesByType['Vip'].map(id => ({ id, type: 'Vip' as const })),
  // ];

  const [checkedInBookings] = useState<Booking[]>([
    { id: 'B1', cageId: 'CB-001', cageType: 'Cơ bản', startDate: 1, endDate: 4, customerName: 'Nguyễn Văn A', hamsterName: 'Mochi' },
    { id: 'B2', cageId: 'CB-002', cageType: 'Cơ bản', startDate: 1, endDate: 4, customerName: 'Trần Thị B', hamsterName: 'Bông' },
    { id: 'B3', cageId: 'CB-003', cageType: 'Cơ bản', startDate: 2, endDate: 5, customerName: 'Lê Văn C', hamsterName: 'Peanut' },
    { id: 'B4', cageId: 'TC-001', cageType: 'Tiêu chuẩn', startDate: 2, endDate: 11, customerName: 'Phạm Thị D', hamsterName: 'Bubble' },
    { id: 'B5', cageId: 'TC-002', cageType: 'Tiêu chuẩn', startDate: 2, endDate: 3, customerName: 'Hoàng Văn E', hamsterName: 'Cookie' },
    { id: 'B6', cageId: 'TC-003', cageType: 'Tiêu chuẩn', startDate: 2, endDate: 4, customerName: 'Võ Thị F', hamsterName: 'Oreo' },
    { id: 'B7', cageId: 'DD-001', cageType: 'Đầy đủ', startDate: 3, endDate: 5, customerName: 'Đặng Văn G', hamsterName: 'Fluffy' },
    { id: 'B8', cageId: 'DD-002', cageType: 'Đầy đủ', startDate: 3, endDate: 6, customerName: 'Bùi Thị H', hamsterName: 'Coco' },
    { id: 'B9', cageId: 'DD-003', cageType: 'Đầy đủ', startDate: 2, endDate: 4, customerName: 'Dương Văn I', hamsterName: 'Marshmallow' },
    { id: 'B10', cageId: 'VIP-001', cageType: 'Vip', startDate: 2, endDate: 4, customerName: 'Mai Thị K', hamsterName: 'Prince' },
    { id: 'B11', cageId: 'VIP-002', cageType: 'Vip', startDate: 3, endDate: 5, customerName: 'Chu Văn L', hamsterName: 'Princess' },
    { id: 'B12', cageId: 'VIP-003', cageType: 'Vip', startDate: 4, endDate: 6, customerName: 'Lý Thị M', hamsterName: 'Cupcake' },
  ]);

  const [notCheckedInBookings] = useState<Booking[]>([
    { id: 'B13', cageId: 'CB-001', cageType: 'Cơ bản', startDate: 5, endDate: 6, customerName: 'Phan Văn N', hamsterName: 'Butter' },
    { id: 'B14', cageId: 'CB-002', cageType: 'Cơ bản', startDate: 5, endDate: 8, customerName: 'Tô Thị O', hamsterName: 'Snowball' },
    { id: 'B15', cageId: 'CB-003', cageType: 'Cơ bản', startDate: 6, endDate: 10, customerName: 'Cao Văn P', hamsterName: 'Nugget' },
    { id: 'B16', cageId: 'TC-001', cageType: 'Tiêu chuẩn', startDate: 4, endDate: 5, customerName: 'Hồ Thị Q', hamsterName: 'Dumpling' },
    { id: 'B17', cageId: 'TC-002', cageType: 'Tiêu chuẩn', startDate: 4, endDate: 9, customerName: 'Đinh Văn R', hamsterName: 'Tofu' },
    { id: 'B18', cageId: 'TC-003', cageType: 'Tiêu chuẩn', startDate: 5, endDate: 6, customerName: 'Vũ Thị S', hamsterName: 'Pudding' },
    { id: 'B19', cageId: 'DD-001', cageType: 'Đầy đủ', startDate: 5, endDate: 6, customerName: 'Trịnh Văn T', hamsterName: 'Brownie' },
    { id: 'B20', cageId: 'DD-002', cageType: 'Đầy đủ', startDate: 5, endDate: 7, customerName: 'Lưu Thị U', hamsterName: 'Muffin' },
    { id: 'B21', cageId: 'DD-003', cageType: 'Đầy đủ', startDate: 5, endDate: 10, customerName: 'Đỗ Văn V', hamsterName: 'Waffle' },
    { id: 'B22', cageId: 'VIP-001', cageType: 'Vip', startDate: 5, endDate: 6, customerName: 'Ngô Thị W', hamsterName: 'Truffle' },
    { id: 'B23', cageId: 'VIP-002', cageType: 'Vip', startDate: 5, endDate: 6, customerName: 'Hà Văn X', hamsterName: 'Caramel' },
    { id: 'B24', cageId: 'VIP-003', cageType: 'Vip', startDate: 5, endDate: 8, customerName: 'Lâm Thị Y', hamsterName: 'Biscuit' },
  ]);

  const dates = Array.from({ length: 11 }, (_, i) => i + 1);
  const CELL_WIDTH = 80;
  
  const getCageTypeClass = (cageType: string) => {
    const classes: Record<string, string> = {
      'Cơ bản': 'cage-type-basic',
      'Tiêu chuẩn': 'cage-type-standard',
      'Đầy đủ': 'cage-type-full',
      'Vip': 'cage-type-vip'
    };
    return classes[cageType] || 'cage-type-basic';
  };

  const renderCheckedInGrid = () => {
    return (
      <Card 
        className="schedule-card"
        title={<div className="card-title">Bảng theo dõi danh sách đã check in</div>}
        headStyle={{ background: 'linear-gradient(to right, #15803d, #16a34a)', border: 'none' }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="table-container">
          <div className="table-wrapper">
            {/* Date Header Row */}
            <div className="header-row">
              <div className="cage-id-header">Mã Lồng</div>
              {dates.map(date => (
                <div key={date} className="date-cell" style={{ width: `${CELL_WIDTH}px` }}>
                  <div>{String(date).padStart(2, '0')}/01</div>
                </div>
              ))}
            </div>

            {/* Cage Type Sections */}
            {Object.entries(cagesByType).map(([cageType, cages]) => (
              <div key={cageType}>
                {/* Cage Type Header Row */}
                <div className={`cage-type-row ${getCageTypeClass(cageType)}`}>
                  <div className="cage-type-label">{cageType}</div>
                  {dates.map(date => (
                    <div key={date} className="empty-cell" style={{ width: `${CELL_WIDTH}px` }} />
                  ))}
                </div>

                {/* Cage Rows */}
                {cages.map((cageId) => {
                  const cageBookings = checkedInBookings.filter(b => b.cageId === cageId);
                  
                  return (
                    <div key={cageId} className="cage-row">
                      <div className="cage-id-cell">{cageId}</div>
                      <div className="date-grid">
                        {/* Date cells as background */}
                        {dates.map(date => (
                          <div key={date} className="grid-cell" style={{ width: `${CELL_WIDTH}px` }} />
                        ))}
                        
                        {/* Booking bars as overlays */}
                        {cageBookings.map(booking => {
                          const duration = booking.endDate - booking.startDate + 1;
                          const leftPosition = (booking.startDate - 1) * CELL_WIDTH;
                          const barWidth = duration * CELL_WIDTH;
                          
                          return (
                            <div
                              key={booking.id}
                              className="booking-bar booking-bar-green"
                              style={{
                                left: `${leftPosition + 4}px`,
                                width: `${barWidth - 8}px`,
                              }}
                            >
                              <div className="booking-text">
                                {booking.customerName} - {booking.hamsterName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  const renderNotCheckedInGrid = () => {
    return (
      <Card 
        className="schedule-card"
        title={<div className="card-title">Bảng theo dõi danh sách chưa check in</div>}
        headStyle={{ background: 'linear-gradient(to right, #c2410c, #ea580c)', border: 'none' }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="table-container">
          <div className="table-wrapper">
            {/* Date Header Row */}
            <div className="header-row">
              <div className="cage-id-header">Loại Lồng</div>
              {dates.map(date => (
                <div key={date} className="date-cell" style={{ width: `${CELL_WIDTH}px` }}>
                  <div>{String(date).padStart(2, '0')}/01</div>
                </div>
              ))}
            </div>

            {/* Booking Rows */}
            {notCheckedInBookings.map((booking) => {
              const duration = booking.endDate - booking.startDate + 1;
              const leftPosition = (booking.startDate - 1) * CELL_WIDTH;
              const barWidth = duration * CELL_WIDTH;
              
              return (
                <div key={booking.id} className="cage-row">
                  <div className={`cage-type-cell ${getCageTypeClass(booking.cageType)}`}>
                    {booking.cageType}
                  </div>
                  <div className="date-grid">
                    {/* Date cells as background */}
                    {dates.map(date => (
                      <div key={date} className="grid-cell" style={{ width: `${CELL_WIDTH}px` }} />
                    ))}
                    
                    {/* Booking bar as overlay */}
                    <div
                      className="booking-bar booking-bar-orange"
                      style={{
                        left: `${leftPosition + 4}px`,
                        width: `${barWidth - 8}px`,
                      }}
                    >
                      <div className="booking-text">
                        {booking.customerName} - {booking.hamsterName}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="boarding-schedule">
      <div className="schedule-container">
        <div className="page-header">
          <h1 className="page-title">Quản Lý Lịch Ký Gửi Hamster</h1>
          <p className="page-subtitle">Theo dõi và quản lý lịch trình ký gửi theo thời gian thực</p>
        </div>
        
        {renderCheckedInGrid()}
        {renderNotCheckedInGrid()}
      </div>
    </div>
  );
};

export default BoardingSchedule;