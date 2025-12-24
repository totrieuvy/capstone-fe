import { useEffect, useState } from "react";
import { Card, Spin, Table, Tag, Button, Modal, Form, InputNumber, Radio, Select, Input } from "antd";
import { WalletOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import api from "../../../config/axios";
import "./WalletCustomer.scss";

// ======================== Interfaces ========================
interface WalletTransaction {
  id: string;
  status: string;
  amount: number;
  serviceName: string;
  transactionTime: string;
}

interface WalletData {
  balance: number;
  createdAt: string;
  walletTransaction: WalletTransaction[];
}

interface DepositFormValues {
  amount: number;
  paymentMethod: "VNPAY" | "PAYOS";
}

interface WithdrawFormValues {
  amount: number;
  bankAccount: string;
  bankName: string;
  cardOwner: string;
  note?: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

// ======================== Helpers ========================
const parseCustomDateString = (timeString: string): Date => {
  const [datePart, timePart] = timeString.split(" ");
  const [day, month, year] = datePart.split("-");
  // Tạo Date object chuẩn từ giờ địa phương rồi cộng +7h (nếu cần)
  const localDate = new Date(`${year}-${month}-${day}T${timePart}`);
  // Cộng thêm 7 giờ để hiển thị đúng giờ Việt Nam
  localDate.setHours(localDate.getHours() + 7);
  return localDate;
};

// ======================== Component ========================
function WalletCustomer() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  // const [banks, setBanks] = useState<Bank[]>([]);

  const [form] = Form.useForm();
  const [withdrawForm] = Form.useForm();

  const topBanks: Bank[] = [
    {
      id: 1,
      name: "Ngân hàng TMCP Ngoại Thương Việt Nam",
      shortName: "Vietcombank",
      code: "VCB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 2,
      name: "Ngân hàng TMCP Công Thương Việt Nam",
      shortName: "VietinBank",
      code: "CTG",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 3,
      name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
      shortName: "BIDV",
      code: "BIDV",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 4,
      name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
      shortName: "Agribank",
      code: "AGRI",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 5,
      name: "Ngân hàng TMCP Kỹ thương Việt Nam",
      shortName: "Techcombank",
      code: "TCB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 6,
      name: "Ngân hàng Quân đội",
      shortName: "MB Bank",
      code: "MBB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 7,
      name: "Ngân hàng Á Châu",
      shortName: "ACB",
      code: "ACB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 8,
      name: "Ngân hàng Sài Gòn Thương Tín",
      shortName: "Sacombank",
      code: "STB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 9,
      name: "Ngân hàng Việt Nam Thịnh Vượng",
      shortName: "VPBank",
      code: "VPB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
    {
      id: 10,
      name: "Ngân hàng Tiên Phong",
      shortName: "TPBank",
      code: "TPB",
      bin: "",
      logo: "",
      transferSupported: 1,
      lookupSupported: 1,
    },
  ];

  const [banks] = useState<Bank[]>(topBanks);

  // ======================== Fetch APIs ========================
  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/wallet");
      if (data.code === 200) {
        setWallet(data.data);
      } else {
        toast.error(data.message || "Không thể tải thông tin ví");
      }
    } catch {
      toast.error("Lỗi khi tải ví khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // const fetchBanks = async () => {
  //   try {
  //     const res = await axios.get("https://api.vietqr.io/v2/banks");
  //     if (res.data.code === "00") setBanks(res.data.data);
  //   } catch {
  //     toast.error("Không thể tải danh sách ngân hàng");
  //   }
  // };

  useEffect(() => {
    document.title = "Ví của bạn";
    fetchWallet();
    // fetchBanks();
  }, []);

  // ======================== Deposit ========================
  const handleDeposit = async (values: DepositFormValues) => {
    setDepositing(true);
    try {
      const response = await api.post("/api/wallet/deposit", values);

      if (response.data.code === 201 && response.data.data?.paymentUrl) {
        toast.success("Đang chuyển hướng đến trang thanh toán...");
        window.location.href = response.data.data.paymentUrl;
      } else {
        toast.error(response.data.message || "Tạo giao dịch thất bại.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi tạo giao dịch.");
    } finally {
      setDepositing(false);
      setIsDepositOpen(false);
    }
  };

  // ======================== Withdraw ========================
  const handleWithdraw = async (values: WithdrawFormValues) => {
    setWithdrawing(true);
    try {
      const response = await api.post("/api/wallet/withdraw", values);

      if (response.data.code === 200) {
        toast.success("Yêu cầu rút tiền đã được gửi thành công!");
        withdrawForm.resetFields();
        fetchWallet();
      } else {
        toast.error(response.data.message || "Rút tiền thất bại!");
      }
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        toast.error(axiosErr.response?.data?.message || err.message || "Đã xảy ra lỗi khi rút tiền.");
      } else {
        toast.error("Đã xảy ra lỗi không xác định khi rút tiền.");
      }
    } finally {
      setWithdrawing(false);
      setIsWithdrawOpen(false);
    }
  };

  // ======================== Table columns ========================
  const columns = [
    {
      title: "Ngày",
      dataIndex: "transactionTime",
      key: "date",
      render: (time: string) => {
        const d = parseCustomDateString(time);
        return d.toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Thời gian",
      dataIndex: "transactionTime",
      key: "time",
      render: (time: string) => {
        const d = parseCustomDateString(time);
        return d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (service: string) => {
        const serviceConfig: Record<string, { text: string; color: string }> = {
          WALLET: { text: "Ví ảo", color: "purple" },
          ORDER: { text: "Đặt hàng", color: "blue" },
          BOOKING: { text: "Đặt lịch giữ hộ", color: "cyan" },
          GROOMING: { text: "Dịch vụ làm đẹp", color: "geekblue" },
          MEDICAL: { text: "Khám bệnh", color: "magenta" },
        };
        const config = serviceConfig[service] || { text: service, color: "orange" };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig: Record<string, { text: string; color: string }> = {
          BOOKED: { text: "Đã đặt lịch", color: "cyan" },
          CHECK_OUT: { text: "Đã trả", color: "blue" },
          IN_PROGRESS: { text: "Đang thực hiện", color: "processing" },
          PAID: { text: "Đã thanh toán", color: "geekblue" },
          COMPLETED: { text: "Đã hoàn thành", color: "green" },
          FAILED: { text: "Thất bại", color: "red" },
          REJECTED: { text: "Đã từ chối", color: "volcano" },
          PENDING: { text: "Đang xử lý", color: "gold" },
          REFUNDED: { text: "Đã hoàn tiền", color: "lime" },
          CANCELLED: { text: "Đã hủy", color: "magenta" },
        };
        const config = statusConfig[status] || { text: status, color: "default" };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number) => <b className="wallet__amount">{amount.toLocaleString("vi-VN")} đ</b>,
    },
  ];

  const sortedTransactions =
    wallet?.walletTransaction?.sort(
      (a, b) => parseCustomDateString(b.transactionTime).getTime() - parseCustomDateString(a.transactionTime).getTime()
    ) || [];

  // ======================== JSX ========================
  return (
    <>
      <div className="wallet-container">
        <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
          {wallet && (
            <>
              <div className="wallet__header">
                <h2>💰 Ví của bạn</h2>
              </div>

              {/* Balance card */}
              <Card className="wallet__card wallet__balance-card" hoverable>
                <div className="wallet__balance-content">
                  <div className="wallet__icon-container">
                    <WalletOutlined className="wallet__icon" />
                  </div>
                  <div className="wallet__balance-info">
                    <p className="wallet__balance-label">Số dư hiện tại</p>
                    <p className="wallet__balance-amount">{wallet.balance.toLocaleString("vi-VN")} đ</p>
                  </div>

                  <div className="wallet__btn-group">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="wallet__add-btn"
                      onClick={() => setIsDepositOpen(true)}
                    >
                      Nạp tiền
                    </Button>
                    <Button
                      danger
                      icon={<MinusOutlined />}
                      className="wallet__withdraw-btn"
                      onClick={() => setIsWithdrawOpen(true)}
                    >
                      Rút tiền
                    </Button>
                  </div>
                </div>
                <p className="wallet__created">
                  Ví được tạo ngày {new Date(wallet.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </Card>

              {/* Transaction history */}
              <Card className="wallet__card wallet__transaction-card" hoverable>
                <h3>Lịch sử giao dịch</h3>
                <Table columns={columns} dataSource={sortedTransactions} pagination={{ pageSize: 6 }} rowKey="id" />
              </Card>
            </>
          )}
        </Spin>
      </div>

      {/* Modal Nạp tiền */}
      <Modal
        title="Nạp tiền vào ví"
        open={isDepositOpen}
        onCancel={() => setIsDepositOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsDepositOpen(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={depositing} onClick={() => form.submit()}>
            Thanh toán
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDeposit}
          initialValues={{ paymentMethod: "VNPAY", amount: 50000 }}
        >
          <Form.Item
            name="amount"
            label="Số tiền"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền!" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (Number(value) < 10000) {
                    return Promise.reject(new Error("Số tiền tối thiểu là 10.000đ"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(v) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => (v ? v.replace(/,/g, "") : "")}
            />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            rules={[{ required: true, message: "Vui lòng chọn phương thức!" }]}
          >
            <Radio.Group>
              <Radio value="VNPAY">VNPAY</Radio>
              <Radio value="PAYOS">PAYOS</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Rút tiền */}
      <Modal
        title="Rút tiền từ ví"
        open={isWithdrawOpen}
        onCancel={() => setIsWithdrawOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsWithdrawOpen(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={withdrawing} onClick={() => withdrawForm.submit()}>
            Xác nhận rút
          </Button>,
        ]}
      >
        <Form form={withdrawForm} layout="vertical" onFinish={handleWithdraw}>
          <Form.Item
            name="amount"
            label="Số tiền muốn rút"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền!" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (Number(value) < 10000) {
                    return Promise.reject("Số tiền tối thiểu là 10,000đ");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={10000}
              formatter={(v?: string | number) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v?: string) => (v ? v.replace(/,/g, "") : "")}
            />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="Ngân hàng"
            rules={[{ required: true, message: "Vui lòng chọn ngân hàng!" }]}
          >
            <Select
              showSearch
              placeholder="Chọn ngân hàng"
              options={banks.map((b) => ({
                label: `${b.name} - ${b.shortName}`,
                value: `${b.name} - ${b.shortName}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="bankAccount"
            label="Số tài khoản"
            rules={[
              { required: true, message: "Vui lòng nhập số tài khoản!" },
              { pattern: /^[0-9]+$/, message: "Số tài khoản chỉ được chứa số!" },
              { min: 6, message: "Số tài khoản phải từ 6 chữ số trở lên" },
              { max: 20, message: "Số tài khoản không được quá 20 chữ số" },
            ]}
          >
            <Input placeholder="Nhập số tài khoản" />
          </Form.Item>
          <Form.Item
            name="cardOwner"
            label="Tên chủ thẻ"
            rules={[
              { required: true, message: "Vui lòng nhập tên chủ thẻ!" },
              { min: 3, message: "Tên chủ thẻ phải từ 3 ký tự trở lên" },
            ]}
          >
            <Input placeholder="Nhập tên chủ thẻ" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default WalletCustomer;
