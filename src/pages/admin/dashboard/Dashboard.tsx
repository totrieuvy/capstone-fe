import { useEffect, useState } from "react";
import { Card, Row, Col, DatePicker, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from "chart.js";
import "./Dashboard.scss";

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

interface DashboardTableProps {
  title: string;
  columns: string[];
  data: Record<string, string | number>[];
}

// ======================= TABLE COMPONENT =======================

const DashboardTable: React.FC<DashboardTableProps> = ({ title, columns, data }) => (
  <Card title={title} className="dashboard-table-card equal-card">
    <table className="dashboard-table">
      <thead>
        <tr>
          {columns.map((c: string, i: number) => (
            <th key={i}>{c}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, i: number) => (
          <tr key={i}>
            {Object.values(row).map((v, j: number) => (
              <td key={j}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

// ======================= INTERFACES =======================

interface RevenueStats {
  medicalRevenue: number;
  groomingRevenue: number;
  boardingRevenue: number;
  orderRevenue: number;
  totalRevenue: number;
}

interface TopService {
  serviceName: string;
  totalRevenue: number;
  totalTimesPerformed: number;
}

interface TopProduct {
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface TopCustomer {
  customerName: string;
  totalAppointments: number;
  totalSpent: number;
}

interface TopVet {
  vetName: string;
  totalAppointmentsCompleted: number;
}

interface TopStaff {
  staffName: string;
  totalServicesCompleted: number;
}

interface UserStats {
  totalStaff: number;
  totalCustomers: number;
  totalVets: number;
}

// ======================= DASHBOARD =======================

function Dashboard() {
  const [loading, setLoading] = useState(false);

  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [services, setServices] = useState<TopService[]>([]);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [vets, setVets] = useState<TopVet[]>([]);
  const [staff, setStaff] = useState<TopStaff[]>([]);
  const [users, setUsers] = useState<UserStats | null>(null);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf("year"), dayjs()]);

  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const [monthlyMedical, setMonthlyMedical] = useState<number[]>([]);
  const [monthlyGrooming, setMonthlyGrooming] = useState<number[]>([]);
  const [monthlyBoarding, setMonthlyBoarding] = useState<number[]>([]);
  const [monthlyOrder, setMonthlyOrder] = useState<number[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number[]>([]);

  // ======================= FETCH 12 MONTHS =======================

  const fetchMonthlyRevenue = async (year: number) => {
    try {
      const calls = Array.from({ length: 12 }, (_, m) => {
        const start = dayjs().year(year).month(m).startOf("month").format("YYYY-MM-DD");
        const end = dayjs().year(year).month(m).endOf("month").format("YYYY-MM-DD");
        return api.get("/api/dashboard/revenue", { params: { startDate: start, endDate: end } });
      });

      const res = await Promise.all(calls);

      setMonthlyMedical(res.map((r) => r.data.data.medicalRevenue));
      setMonthlyGrooming(res.map((r) => r.data.data.groomingRevenue));
      setMonthlyBoarding(res.map((r) => r.data.data.boardingRevenue));
      setMonthlyOrder(res.map((r) => r.data.data.orderRevenue));
      setMonthlyTotal(res.map((r) => r.data.data.totalRevenue));
    } catch {
      toast.error("Lỗi tải doanh thu theo năm!");
    }
  };

  // ======================= APIs =======================

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
      toast.error("Lỗi tải dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ======================= INIT LOAD =======================

  useEffect(() => {
    const start = dateRange[0].format("YYYY-MM-DD");
    const end = dateRange[1].format("YYYY-MM-DD");

    loadAll(start, end);
    fetchMonthlyRevenue(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => {
    if (!dates || !dates[0] || !dates[1]) return;
    setDateRange([dates[0], dates[1]]);
    loadAll(dateStrings[0], dateStrings[1]);
  };

  if (!revenue || !users || loading) {
    return <Spin spinning style={{ width: "100%", marginTop: 60 }} />;
  }

  const months = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

  const multiLineData = {
    labels: months,
    datasets: [
      { label: "Khám bệnh", data: monthlyMedical, borderColor: "#1890ff", tension: 0.4 },
      { label: "Grooming", data: monthlyGrooming, borderColor: "#13c2c2", tension: 0.4 },
      { label: "Boarding", data: monthlyBoarding, borderColor: "#fa8c16", tension: 0.4 },
      { label: "Đơn hàng", data: monthlyOrder, borderColor: "#f5222d", tension: 0.4 },
      {
        label: "TỔNG DOANH THU",
        data: monthlyTotal,
        borderColor: "#52c41a",
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  return (
    <div className="Dashboard">
      <h1 className="dashboard-title">Thống kê tổng quan</h1>

      {/* YEAR PICKER */}
      <div className="dashboard-center-picker">
        <span>Chọn năm:</span>
        <DatePicker
          picker="year"
          value={dayjs(`${selectedYear}`)}
          onChange={(d) => {
            if (d) {
              const y = d.year();
              setSelectedYear(y);
              fetchMonthlyRevenue(y);
            }
          }}
        />
      </div>

      {/* LINE CHART */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={`Doanh thu theo 12 tháng của năm ${selectedYear}`}>
            <div className="chart-container">
              <Line data={multiLineData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* RANGE PICKER */}
      <div className="dashboard-center-picker" style={{ marginTop: 30 }}>
        <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="YYYY-MM-DD" />
      </div>

      {/* ====================== TOP SERVICES — BAR ====================== */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card title="Top Services (Doanh thu theo dịch vụ)" className="chart-card">
            <div className="chart-container" style={{ height: 350 }}>
              <Bar
                data={{
                  labels: services.map((s) => s.serviceName),
                  datasets: [
                    {
                      label: "Doanh thu",
                      data: services.map((s) => s.totalRevenue),
                      backgroundColor: "#722ed1",
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ====================== TOP PRODUCTS — BAR ====================== */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Top Products" className="chart-card">
            <div className="chart-container" style={{ height: 350 }}>
              <Bar
                data={{
                  labels: products.map((p) => p.productName),
                  datasets: [
                    {
                      label: "Doanh thu",
                      data: products.map((p) => p.totalRevenue),
                      backgroundColor: "#fa8c16",
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ====================== TOP CUSTOMERS ====================== */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <DashboardTable
            title="Top Customers"
            columns={["CUSTOMER", "APPOINTMENTS", "SPENT"]}
            data={customers.map((c) => ({
              CUSTOMER: c.customerName,
              APPOINTMENTS: c.totalAppointments,
              SPENT: c.totalSpent.toLocaleString() + " VND",
            }))}
          />
        </Col>
      </Row>

      {/* ====================== TOP STAFF + TOP VETS (SIDE BY SIDE) ====================== */}
      <Row gutter={[16, 16]} className="equal-row">
        <Col xs={24} md={12}>
          <DashboardTable
            title="Top Staff"
            columns={["STAFF", "COMPLETED SERVICES"]}
            data={staff.map((s) => ({
              STAFF: s.staffName,
              "COMPLETED SERVICES": s.totalServicesCompleted,
            }))}
          />
        </Col>

        <Col xs={24} md={12}>
          <DashboardTable
            title="Top Vets"
            columns={["VET", "APPOINTMENTS COMPLETED"]}
            data={vets.map((v) => ({
              VET: v.vetName,
              "APPOINTMENTS COMPLETED": v.totalAppointmentsCompleted,
            }))}
          />
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
