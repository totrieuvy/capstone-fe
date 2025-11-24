import { useEffect, useState } from "react";
import { Card, DatePicker, Spin, Row, Col } from "antd";
import dayjs, { Dayjs } from "dayjs";
import api from "../../../config/axios";
import { toast } from "react-toastify";

import { Line, Bar, Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
} from "chart.js";

import "./Dashboard.scss";

ChartJS.register(
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler
);

// =================== INTERFACES ===================
interface YearlyRevenueItem {
  month: number;
  year: number;
  medicalRevenue: number;
  groomingRevenue: number;
  boardingRevenue: number;
  orderRevenue: number;
  totalRevenue: number;
}

interface YearlyResponse {
  data: YearlyRevenueItem[];
}

interface TopProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface TopProductResponse {
  data: TopProduct[];
}

interface CageType {
  cageTypeId: string;
  cageTypeName: string;
  totalBookings: number;
  totalRevenue: number;
}

interface CageTypeResponse {
  data: CageType[];
}

interface GroomingService {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  totalTimesPerformed: number;
  totalRevenue: number;
}

interface GroomingServiceResponse {
  data: GroomingService[];
}

// =================== MAIN COMPONENT ===================
const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [loading, setLoading] = useState<boolean>(false);

  const [yearlyData, setYearlyData] = useState<YearlyRevenueItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cageTypes, setCageTypes] = useState<CageType[]>([]);
  const [groomingServices, setGroomingServices] = useState<GroomingService[]>([]);

  const [summary, setSummary] = useState({
    medical: 0,
    grooming: 0,
    boarding: 0,
    order: 0,
    total: 0,
  });

  // =================== API CALLS ===================
  const fetchYearlyRevenue = async (year: number) => {
    try {
      setLoading(true);

      const res = await api.get<YearlyResponse>("/api/dashboard/revenue/yearly", {
        params: { year },
      });

      const list = res.data.data;
      setYearlyData(list);

      setSummary({
        medical: list.reduce((a, b) => a + b.medicalRevenue, 0),
        grooming: list.reduce((a, b) => a + b.groomingRevenue, 0),
        boarding: list.reduce((a, b) => a + b.boardingRevenue, 0),
        order: list.reduce((a, b) => a + b.orderRevenue, 0),
        total: list.reduce((a, b) => a + b.totalRevenue, 0),
      });
    } catch {
      toast.error("Không tải được doanh thu!");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async (year: number) => {
    try {
      const res = await api.get<TopProductResponse>("/api/dashboard/top-products", { params: { year, limit: 5 } });
      setTopProducts(res.data.data);
    } catch {
      toast.error("Không tải được top sản phẩm!");
    }
  };

  const fetchCageTypes = async (year: number) => {
    try {
      const res = await api.get<CageTypeResponse>("/api/dashboard/top-cage-types", { params: { year, limit: 5 } });
      setCageTypes(res.data.data);
    } catch {
      toast.error("Không tải được loại chuồng!");
    }
  };

  const fetchGroomingServices = async (year: number) => {
    try {
      const res = await api.get<GroomingServiceResponse>("/api/dashboard/top-grooming-services", {
        params: { year, limit: 5 },
      });
      setGroomingServices(res.data.data);
    } catch {
      toast.error("Không tải được dịch vụ grooming!");
    }
  };

  // =================== INIT ===================
  useEffect(() => {
    fetchYearlyRevenue(selectedYear);
    fetchTopProducts(selectedYear);
    fetchCageTypes(selectedYear);
    fetchGroomingServices(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleYearChange = (d: Dayjs | null) => {
    if (!d) return;
    const y = d.year();
    setSelectedYear(y);

    fetchYearlyRevenue(y);
    fetchTopProducts(y);
    fetchCageTypes(y);
    fetchGroomingServices(y);
  };

  if (loading || yearlyData.length === 0) return <Spin spinning style={{ width: "100%", marginTop: 60 }} />;

  // =================== CHART DATA ===================
  const lineData = {
    labels: yearlyData.map((m) => `Tháng ${m.month}`),
    datasets: [
      {
        label: "Khám bệnh",
        data: yearlyData.map((m) => m.medicalRevenue),
        borderColor: "#1890ff",
        tension: 0.4,
      },
      {
        label: "Grooming",
        data: yearlyData.map((m) => m.groomingRevenue),
        borderColor: "#13c2c2",
        tension: 0.4,
      },
      {
        label: "Boarding",
        data: yearlyData.map((m) => m.boardingRevenue),
        borderColor: "#fa8c16",
        tension: 0.4,
      },
      {
        label: "Đơn hàng",
        data: yearlyData.map((m) => m.orderRevenue),
        borderColor: "#f5222d",
        tension: 0.4,
      },
      {
        label: "TỔNG DOANH THU",
        data: yearlyData.map((m) => m.totalRevenue),
        borderColor: "#52c41a",
        borderWidth: 3,
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: topProducts.map((p) => p.productName),
    datasets: [
      {
        label: "Doanh thu",
        data: topProducts.map((p) => p.totalRevenue),
        backgroundColor: "#722ed1",
      },
    ],
  };

  const pieCageData = {
    labels: cageTypes.map((c) => c.cageTypeName),
    datasets: [
      {
        data: cageTypes.map((c) => c.totalRevenue),
        backgroundColor: ["#ff7875", "#ffd666", "#95de64", "#69c0ff", "#b37feb"],
      },
    ],
  };

  const pieGroomData = {
    labels: groomingServices.map((s) => s.serviceName),
    datasets: [
      {
        data: groomingServices.map((s) => s.totalRevenue),
        backgroundColor: ["#73d13d", "#ff9c6e", "#5cdbd3", "#85a5ff", "#f759ab"],
      },
    ],
  };

  return (
    <div className="Dashboard">
      <h1 className="dashboard-title">Thống kê theo năm</h1>

      <div className="dashboard-center-picker">
        <span>Chọn năm:</span>
        <DatePicker picker="year" value={dayjs(`${selectedYear}`)} onChange={handleYearChange} />
      </div>

      {/* 5 BOXES */}
      <div className="stat-row">
        <div className="stat-box">
          <h3>Khám bệnh</h3>
          <h2>{summary.medical.toLocaleString()} VND</h2>
        </div>
        <div className="stat-box">
          <h3>Grooming</h3>
          <h2>{summary.grooming.toLocaleString()} VND</h2>
        </div>
        <div className="stat-box">
          <h3>Boarding</h3>
          <h2>{summary.boarding.toLocaleString()} VND</h2>
        </div>
        <div className="stat-box">
          <h3>Đơn hàng</h3>
          <h2>{summary.order.toLocaleString()} VND</h2>
        </div>
        <div className="stat-box">
          <h3>Tổng doanh thu</h3>
          <h2 style={{ color: "#52c41a" }}>{summary.total.toLocaleString()} VND</h2>
        </div>
      </div>

      {/* LINE CHART */}
      <Card title={`Doanh thu 12 tháng (${selectedYear})`} style={{ marginTop: 30 }}>
        <div className="chart-container">
          <Line data={lineData} />
        </div>
      </Card>

      {/* BAR CHART */}
      <Card title="Top 5 sản phẩm bán chạy" style={{ marginTop: 30 }}>
        <div className="chart-container" style={{ height: 350 }}>
          <Bar
            data={barData}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const revenue = Number(ctx.raw).toLocaleString();
                      const quantity = topProducts[ctx.dataIndex].totalQuantitySold;
                      return [`Doanh thu: ${revenue} VND`, `Số lượng bán: ${quantity}`];
                    },
                  },
                },
              },
            }}
          />
        </div>
      </Card>

      {/* PIE CHARTS */}
      <Row gutter={[16, 16]} style={{ marginTop: 30 }}>
        {/* TOP CAGE TYPES */}
        <Col xs={24} md={12}>
          <Card title="Top 5 loại chuồng được đặt nhiều nhất">
            <div className="chart-container">
              <Pie
                data={pieCageData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const index = context.dataIndex;
                          const cage = cageTypes[index];

                          return [
                            `${cage.cageTypeName}`,
                            `Doanh thu: ${cage.totalRevenue.toLocaleString()} VND`,
                            `Số lần sử dụng: ${cage.totalBookings}`,
                          ];
                        },
                      },
                    },
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>

        {/* TOP GROOMING SERVICES */}
        <Col xs={24} md={12}>
          <Card title="Top 5 dịch vụ Grooming được đặt nhiều nhất">
            <div className="chart-container">
              <Pie
                data={pieGroomData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const index = context.dataIndex;
                          const service = groomingServices[index];

                          return [
                            `${service.serviceName}`,
                            `Doanh thu: ${service.totalRevenue.toLocaleString()} VND`,
                            `Thực hiện: ${service.totalTimesPerformed} lần`,
                          ];
                        },
                      },
                    },
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
