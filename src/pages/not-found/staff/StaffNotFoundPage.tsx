import { Result, Button, Layout } from "antd";
import { Link } from "react-router-dom";
import "./StaffNotFoundPage.scss";

const { Content } = Layout;

function StaffNotFoundPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Result
          status="404"
          title="404"
          subTitle="Oops! Trang bạn đang tìm kiếm không tồn tại."
          extra={
            <Link to="/STAFF">
              <Button type="primary" size="large">
                Về trang chủ 
              </Button>
            </Link>
          }
        />
      </Content>
    </Layout>
  );
}

export default StaffNotFoundPage;
