import { Result, Button, Layout } from "antd";
import { Link } from "react-router-dom";
import "./AdminNotFoundPage.scss";

const { Content } = Layout;

function AdminNotFoundPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Result
          status="404"
          title="404"
          subTitle="Oops! Trang bạn đang tìm kiếm không tồn tại."
          extra={
            <Link to="/ADMIN">
              <Button type="primary" size="large">
                Về trang chủ Admin
              </Button>
            </Link>
          }
        />
      </Content>
    </Layout>
  );
}

export default AdminNotFoundPage;
