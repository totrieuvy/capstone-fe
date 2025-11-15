import { useEffect, useState } from "react";
import { Card, Row, Col, DatePicker, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import "./Dashboard.scss";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ==========================================================
// INTERFACES
// ==========================================================

interface RevenueStats {
  medicalRevenue: number;
  groomingRevenue: number;
  boardingRevenue: number;
  orderRevenue: number;
  totalRevenue: number;
}

interface TopService {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  totalRevenue: number;
  totalTimesPerformed: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface TopCustomer {
  customerId: string;
  customerName: string;
  email: string;
  totalAppointments: number;
  totalSpent: number;
}

interface TopVet {
  vetId: string;
  vetName: string;
  email: string;
  totalAppointmentsCompleted: number;
}

interface TopStaff {
  staffId: string;
  staffName: string;
  email: string;
  totalServicesCompleted: number;
}

interface UserStats {
  totalStaff: number;
  totalCustomers: number;
  totalVets: number;
}

// ==========================================================
// COMPONENT
// ==========================================================

function Dashboard() {
  const [loading, setLoading] = useState<boolean>(false);

  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [services, setServices] = useState<TopService[]>([]);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [vets, setVets] = useState<TopVet[]>([]);
  const [staff, setStaff] = useState<TopStaff[]>([]);
  const [users, setUsers] = useState<UserStats | null>(null);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf("year"), dayjs()]);

  // ==========================================================
  // API CALLS
  // ==========================================================

  const fetchRevenue = async (start: string, end: string) => {
    const res = await api.get<{ data: RevenueStats }>("/api/dashboard/revenue", {
      params: { startDate: start, endDate: end },
    });
    setRevenue(res.data.data);
  };

  const fetchTopServices = async (start: string, end: string) => {
    const res = await api.get<{ data: TopService[] }>("/api/dashboard/top-services", {
      params: { startDate: start, endDate: end, limit: 5 },
    });
    setServices(res.data.data);
  };

  const fetchTopProducts = async (start: string, end: string) => {
    const res = await api.get<{ data: TopProduct[] }>("/api/dashboard/top-products", {
      params: { startDate: start, endDate: end, limit: 5 },
    });
    setProducts(res.data.data);
  };

  const fetchTopCustomers = async (start: string, end: string) => {
    const res = await api.get<{ data: TopCustomer[] }>("/api/dashboard/top-customers", {
      params: { startDate: start, endDate: end, limit: 5 },
    });
    setCustomers(res.data.data);
  };

  const fetchTopVets = async (start: string, end: string) => {
    const res = await api.get<{ data: TopVet[] }>("/api/dashboard/top-vets", {
      params: { startDate: start, endDate: end, limit: 5 },
    });
    setVets(res.data.data);
  };

  const fetchTopStaff = async (start: string, end: string) => {
    const res = await api.get<{ data: TopStaff[] }>("/api/dashboard/top-staff", {
      params: { startDate: start, endDate: end, limit: 5 },
    });
    setStaff(res.data.data);
  };

  const fetchUserStats = async () => {
    const res = await api.get<{ data: UserStats }>("/api/dashboard/users");
    setUsers(res.data.data);
  };

  const loadAll = async (start: string, end: string) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRevenue(start, end),
        fetchTopServices(start, end),
        fetchTopProducts(start, end),
        fetchTopCustomers(start, end),
        fetchTopVets(start, end),
        fetchTopStaff(start, end),
        fetchUserStats(),
      ]);
    } catch {
      toast.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INIT LOAD
  // ==========================================================

  useEffect(() => {
    const start = dateRange[0].format("YYYY-MM-DD");
    const end = dateRange[1].format("YYYY-MM-DD");
    loadAll(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // HANDLE DATE CHANGE (NO ANY)
  // ==========================================================

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => {
    if (!dates || !dates[0] || !dates[1]) return;

    const [start, end] = dates;
    const [startStr, endStr] = dateStrings;

    setDateRange([start, end]);
    loadAll(startStr, endStr);
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading || !revenue || !users) {
    return <Spin spinning style={{ width: "100%", marginTop: 60 }} />;
  }

  // ==========================================================
  // CHART DATA
  // ==========================================================

  const revenueData = {
    labels: ["Khám bệnh", "Grooming", "Boarding", "Đơn hàng"],
    datasets: [
      {
        label: "Doanh thu",
        data: [revenue.medicalRevenue, revenue.groomingRevenue, revenue.boardingRevenue, revenue.orderRevenue],
        backgroundColor: ["#1890ff", "#13c2c2", "#fa8c16", "#f5222d"],
      },
    ],
  };

  const serviceData = {
    labels: services.map((s) => s.serviceName),
    datasets: [
      {
        label: "Doanh thu",
        data: services.map((s) => s.totalRevenue),
        backgroundColor: "#722ed1",
      },
    ],
  };

  const customerData = {
    labels: customers.map((c) => c.customerName),
    datasets: [
      {
        label: "Chi tiêu",
        data: customers.map((c) => c.totalSpent),
        backgroundColor: "#52c41a",
      },
    ],
  };

  const vetData = {
    labels: vets.map((v) => v.vetName),
    datasets: [
      {
        label: "Lịch hẹn hoàn thành",
        data: vets.map((v) => v.totalAppointmentsCompleted),
        backgroundColor: "#eb2f96",
      },
    ],
  };

  const staffData = {
    labels: staff.map((s) => s.staffName),
    datasets: [
      {
        label: "Dịch vụ hoàn thành",
        data: staff.map((s) => s.totalServicesCompleted),
        backgroundColor: "#fa541c",
      },
    ],
  };

  const productData = {
    labels: products.map((p) => p.productName),
    datasets: [
      {
        label: "Số lượng bán",
        data: products.map((p) => Math.round(p.totalQuantitySold)),
        backgroundColor: "#faad14",
      },
    ],
  };

  const verticalOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const horizontalOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          callback: function (value: number | string) {
            return Number(value).toFixed(0); // HIỂN THỊ NGUYÊN
          },
        },
      },
    },
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="Dashboard">
      <h1 className="dashboard-title">Thống kê tổng quan</h1>

      <div className="dashboard__date-picker">
        <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="YYYY-MM-DD" />
      </div>

      {/* ROW 2: Revenue + Top Services */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="Doanh thu theo dịch vụ" className="chart-card">
            <div className="chart-container">
              <Pie data={revenueData} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Top dịch vụ" className="chart-card">
            <div className="chart-container" style={{ height: 400 }}>
              <Bar data={serviceData} options={horizontalOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 5 — Top Products horizontal */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card title="Top sản phẩm bán chạy" className="chart-card">
            <div className="chart-container" style={{ height: 400 }}>
              <Bar data={productData} options={horizontalOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 3 — Top Customers full width */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card title="Top khách hàng chi tiêu nhiều nhất" className="chart-card">
            <div className="chart-container" style={{ height: 400 }}>
              <Bar data={customerData} options={verticalOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 4 — Staff + Vet */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="Top nhân viên" className="chart-card">
            <div className="chart-container" style={{ height: 350 }}>
              <Bar data={staffData} options={verticalOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Top bác sĩ thú y" className="chart-card">
            <div className="chart-container" style={{ height: 350 }}>
              <Bar data={vetData} options={verticalOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* USER STATS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="stat-card" title="Nhân viên">
            <h2>{users.totalStaff}</h2>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-card" title="Khách hàng">
            <h2>{users.totalCustomers}</h2>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-card" title="Bác sĩ thú y">
            <h2>{users.totalVets}</h2>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;

// import { useEffect, useState } from "react";
// import { Card, Row, Col, DatePicker, Spin } from "antd";
// import dayjs, { Dayjs } from "dayjs";
// import api from "../../../config/axios";
// import { toast } from "react-toastify";
// import { Pie, Bar } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
// import "./Dashboard.scss";

// ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// // ================== INTERFACES ==================
// interface RevenueStats {
//   medicalRevenue: number;
//   groomingRevenue: number;
//   boardingRevenue: number;
//   orderRevenue: number;
//   totalRevenue: number;
// }

// interface UserStats {
//   totalStaff: number;
//   totalCustomers: number;
//   totalVets: number;
// }

// interface TopCustomer {
//   customerId: string;
//   customerName: string;
//   email: string;
//   totalAppointments: number;
//   totalSpent: number;
// }

// interface TopStaff {
//   staffId: string;
//   staffName: string;
//   email: string;
//   totalServicesCompleted: number;
// }

// interface TopVet {
//   vetId: string;
//   vetName: string;
//   email: string;
//   totalAppointmentsCompleted: number;
// }

// interface TopProduct {
//   productId: string;
//   productName: string;
//   totalQuantitySold: number;
//   totalRevenue: number;
// }

// interface DashboardData {
//   revenueStats: RevenueStats;
//   userStats: UserStats;
//   topCustomers: TopCustomer[];
//   topStaff: TopStaff[];
//   topVets: TopVet[];
//   topProducts: TopProduct[];
// }
// // =================================================

// function Dashboard() {
//   const [, setLoading] = useState(false);
//   const [stats, setStats] = useState<DashboardData | null>(null);
//   const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf("year"), dayjs()]);

//   const fetchDashboard = async (start?: string, end?: string) => {
//     try {
//       setLoading(true);
//       const response = await api.get("/api/dashboard/stats", {
//         params: {
//           startDate: start || dateRange[0].format("YYYY-MM-DD"),
//           endDate: end || dateRange[1].format("YYYY-MM-DD"),
//         },
//       });
//       setStats(response.data.data);
//     } catch (error) {
//       toast.error("Lấy dữ liệu thống kê thất bại: " + error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     document.title = "Dashboard";
//     fetchDashboard();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /**
//    * FIX: AntD RangePicker onChange typing can be:
//    *   (dates: (Dayjs | null)[] | null, dateStrings: string | (string | null)[])
//    * So we accept that broader signature and then narrow safely.
//    */
//   const handleDateChange = (dates: (Dayjs | null)[] | null, dateStrings: string | (string | null)[]) => {
//     if (dates && Array.isArray(dates) && dates[0] && dates[1] && Array.isArray(dateStrings)) {
//       const d0 = dates[0] as Dayjs;
//       const d1 = dates[1] as Dayjs;
//       const s0 = dateStrings[0] as string;
//       const s1 = dateStrings[1] as string;
//       setDateRange([d0, d1]);
//       fetchDashboard(s0, s1);
//     }
//   };

//   if (!stats) return <Spin spinning={true} style={{ width: "100%", marginTop: 60 }} />;

//   const { revenueStats, userStats, topCustomers, topStaff, topVets, topProducts } = stats;

//   // ================== CHART DATA ==================
//   const revenueData = {
//     labels: ["Khám bệnh", "Grooming", "Boarding", "Đơn hàng"],
//     datasets: [
//       {
//         label: "Doanh thu (VND)",
//         data: [
//           revenueStats.medicalRevenue,
//           revenueStats.groomingRevenue,
//           revenueStats.boardingRevenue,
//           revenueStats.orderRevenue,
//         ],
//         backgroundColor: ["#1890ff", "#13c2c2", "#fa8c16", "#f5222d"],
//         borderWidth: 1,
//       },
//     ],
//   };

//   const customerData = {
//     labels: topCustomers.map((c) => c.customerName),
//     datasets: [
//       {
//         label: "Tổng chi tiêu (VND)",
//         data: topCustomers.map((c) => c.totalSpent),
//         backgroundColor: "#52c41a",
//       },
//     ],
//   };

//   const staffData = {
//     labels: topStaff.map((s) => s.staffName),
//     datasets: [
//       {
//         label: "Dịch vụ hoàn thành",
//         data: topStaff.map((s) => s.totalServicesCompleted),
//         backgroundColor: "#722ed1",
//       },
//     ],
//   };

//   const vetData = {
//     labels: topVets.map((v) => v.vetName),
//     datasets: [
//       {
//         label: "Lịch hẹn hoàn thành",
//         data: topVets.map((v) => v.totalAppointmentsCompleted),
//         backgroundColor: "#eb2f96",
//       },
//     ],
//   };

//   const productData = {
//     labels: topProducts.map((p) => p.productName),
//     datasets: [
//       {
//         label: "Số lượng bán",
//         data: topProducts.map((p) => p.totalQuantitySold),
//         backgroundColor: "#faad14",
//       },
//     ],
//   };
//   // =================================================

//   const verticalChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: "top" as const,
//       },
//     },
//     scales: {
//       x: {
//         ticks: { color: "#333" },
//       },
//       y: {
//         ticks: { color: "#333" },
//       },
//     },
//   };

//   return (
//     <div className="Dashboard">
//       <h1 className="dashboard-title">Thống kê tổng quan</h1>

//       <div className="dashboard__date-picker">
//         {/* onChange đã khớp kiểu AntD */}
//         <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="YYYY-MM-DD" />
//       </div>

//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Card className="stat-card" title="Nhân viên">
//             <h2>{userStats.totalStaff}</h2>
//           </Card>
//         </Col>
//         <Col xs={24} md={8}>
//           <Card className="stat-card" title="Khách hàng">
//             <h2>{userStats.totalCustomers}</h2>
//           </Card>
//         </Col>
//         <Col xs={24} md={8}>
//           <Card className="stat-card" title="Bác sĩ thú y">
//             <h2>{userStats.totalVets}</h2>
//           </Card>
//         </Col>
//       </Row>

//       <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//         <Col xs={24}>
//           <Card title="Doanh thu theo dịch vụ" className="chart-card small-pie">
//             <div className="chart-container pie">
//               <Pie data={revenueData} options={{ maintainAspectRatio: false }} />
//             </div>
//           </Card>
//         </Col>
//       </Row>

//       {/* Các chart dọc, mỗi chart nhỏ hơn */}
//       <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//         <Col xs={24}>
//           <Card title="Top khách hàng chi tiêu nhiều nhất" className="chart-card">
//             <div className="chart-container small-bar">
//               <Bar data={customerData} options={verticalChartOptions} />
//             </div>
//           </Card>
//         </Col>

//         <Col xs={24}>
//           <Card title="Top nhân viên" className="chart-card">
//             <div className="chart-container small-bar">
//               <Bar data={staffData} options={verticalChartOptions} />
//             </div>
//           </Card>
//         </Col>

//         <Col xs={24}>
//           <Card title="Top bác sĩ thú y" className="chart-card">
//             <div className="chart-container small-bar">
//               <Bar data={vetData} options={verticalChartOptions} />
//             </div>
//           </Card>
//         </Col>

//         <Col xs={24}>
//           <Card title="Top sản phẩm bán chạy" className="chart-card">
//             <div className="chart-container small-bar">
//               <Bar data={productData} options={verticalChartOptions} />
//             </div>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// }

// export default Dashboard;
