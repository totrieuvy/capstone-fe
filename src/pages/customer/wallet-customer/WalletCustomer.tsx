import { useEffect, useState } from "react";
import { Card, Spin, message, Table, Tag, Button } from "antd";
import { WalletOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../../config/axios";
import "./WalletCustomer.scss";

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

function WalletCustomer() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "transactionTime",
      key: "transactionTime",
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (service: string) => (
        <Tag color="orange" className="wallet__tag">
          {service}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "SUCCESS" ? "green" : status === "REFUNDED" ? "blue" : status === "FAILED" ? "red" : "orange";
        return (
          <Tag color={color} className="wallet__tag">
            {status}
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

  return (
    <div className="wallet-container">
      <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
        {wallet && (
          <>
            <div className="wallet__header">
              <h2>💰 Ví của bạn</h2>
            </div>

            {/* Khung số dư hiện tại */}
            <Card className="wallet__card wallet__balance-card" hoverable>
              <div className="wallet__balance-content">
                <div className="wallet__icon-container">
                  <WalletOutlined className="wallet__icon" />
                </div>
                <div className="wallet__balance-info">
                  <p className="wallet__balance-label">Số dư hiện tại</p>
                  <p className="wallet__balance-amount">{wallet.balance.toLocaleString("vi-VN")} đ</p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="wallet__add-btn"
                  onClick={() => message.info("Chức năng nạp tiền sẽ sớm có 😄")}
                >
                  Nạp tiền
                </Button>
              </div>

              <p className="wallet__created">
                Ví được tạo ngày {new Date(String(wallet.createdAt)).toLocaleDateString("vi-VN")}
              </p>
            </Card>

            <Card className="wallet__card wallet__transaction-card" hoverable>
              <h3>Lịch sử giao dịch</h3>
              <Table
                columns={columns}
                dataSource={wallet.walletTransaction}
                pagination={{ pageSize: 5 }}
                rowKey="id"
                size="middle"
              />
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
}

export default WalletCustomer;
