import { useEffect, useState } from "react";
import { Card, Spin, message, Table, Tag, Button, Modal, Form, InputNumber, Radio } from "antd";
import { WalletOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../../config/axios";
import "./WalletCustomer.scss";

// --- Interface Definitions ---
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

// --- Helper function to parse DD-MM-YYYY format ---
const parseCustomDateString = (timeString: string): Date => {
  const [datePart, timePart] = timeString.split(" ");
  const [day, month, year] = datePart.split("-");
  // Re-format to YYYY-MM-DDTHH:mm:ss which is reliably parsed
  return new Date(`${year}-${month}-${day}T${timePart}`);
};

// --- Component ---
function WalletCustomer() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [form] = Form.useForm();

  // --- Data Fetching ---
  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/wallet");
      if (data.code === 200) {
        setWallet(data.data);
      } else {
        message.error(data.message || "Không thể tải thông tin ví");
      }
    } catch {
      message.error("Lỗi khi tải ví khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Ví của bạn";
    fetchWallet();
  }, []);

  // --- Modal and Deposit Handlers ---
  const showDepositModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleDeposit = async (values: DepositFormValues) => {
    setDepositing(true);
    try {
      const response = await api.post("/api/wallet/deposit", {
        paymentMethod: values.paymentMethod,
        amount: values.amount,
      });

      if (response.data.code === 201 && response.data.data?.paymentUrl) {
        message.success("Đang chuyển hướng đến trang thanh toán...");
        window.location.href = response.data.data.paymentUrl;
      } else {
        message.error(response.data.message || "Tạo giao dịch thất bại.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tạo giao dịch. Vui lòng thử lại." + (error as Error).message);
    } finally {
      setDepositing(false);
      setIsModalOpen(false);
    }
  };

  // --- Table Columns Definition ---
  const columns = [
    {
      title: "Thời gian",
      dataIndex: "transactionTime",
      key: "transactionTime",
      // Use the helper function here
      render: (time: string) => parseCustomDateString(time).toLocaleDateString("vi-VN"),
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (service: string) => {
        const serviceMap: { [key: string]: string } = {
          WALLET: "Nạp tiền ví ảo",
          ORDER: "Đặt hàng",
        };
        return (
          <Tag color="orange" className="wallet__tag">
            {serviceMap[service] || service}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "orange";
        let text = status;
        switch (status) {
          case "SUCCESS":
          case "COMPLETED":
            color = "green";
            text = "Đã hoàn thành";
            break;
          case "REFUNDED":
            color = "blue";
            text = "Đã hoàn tiền";
            break;
          case "FAILED":
            color = "red";
            text = "Thất bại";
            break;
        }
        return (
          <Tag color={color} className="wallet__tag">
            {text}
          </Tag>
        );
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

  // Sort transactions by time descending using the helper function
  const sortedTransactions = wallet
    ? [...wallet.walletTransaction].sort(
        (a, b) =>
          parseCustomDateString(b.transactionTime).getTime() - parseCustomDateString(a.transactionTime).getTime()
      )
    : [];

  return (
    <>
      <div className="wallet-container">
        <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
          {wallet && (
            <>
              <div className="wallet__header">
                <h2>💰 Ví của bạn</h2>
              </div>

              {/* Balance Card */}
              <Card className="wallet__card wallet__balance-card" hoverable>
                <div className="wallet__balance-content">
                  <div className="wallet__icon-container">
                    <WalletOutlined className="wallet__icon" />
                  </div>
                  <div className="wallet__balance-info">
                    <p className="wallet__balance-label">Số dư hiện tại</p>
                    <p className="wallet__balance-amount">{wallet.balance.toLocaleString("vi-VN")} đ</p>
                  </div>
                  <Button type="primary" icon={<PlusOutlined />} className="wallet__add-btn" onClick={showDepositModal}>
                    Nạp tiền
                  </Button>
                </div>
                <p className="wallet__created">
                  Ví được tạo ngày {new Date(String(wallet.createdAt)).toLocaleDateString("vi-VN")}
                </p>
              </Card>

              {/* Transactions Card */}
              <Card className="wallet__card wallet__transaction-card" hoverable>
                <h3>Lịch sử giao dịch</h3>
                <Table
                  columns={columns}
                  dataSource={sortedTransactions}
                  pagination={{ pageSize: 5 }} // Show 5 items per page
                  rowKey="id"
                  size="middle"
                />
              </Card>
            </>
          )}
        </Spin>
      </div>

      {/* Deposit Modal */}
      <Modal
        title="Nạp tiền vào ví"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={depositing}
            onClick={() => form.submit()}
            className="wallet__add-btn"
          >
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
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: "Vui lòng nhập số tiền!" }]}>
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value: string | undefined): string | number => {
                return value ? value.replace(/\$\s?|(,*)/g, "") : "";
              }}
              min={10000}
              step={10000}
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
    </>
  );
}

export default WalletCustomer;
