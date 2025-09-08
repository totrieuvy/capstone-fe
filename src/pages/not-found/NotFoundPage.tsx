import { Result, Button, Layout } from "antd";
import { Link } from "react-router-dom";
import "./NotFoundPage.scss";

const { Content } = Layout;

function NotFoundPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Result
          status="404"
          title="404"
          subTitle="Oops! The page you're looking for doesn't exist."
          extra={
            <Link to="/">
              <Button type="primary" size="large">
                Back to Home
              </Button>
            </Link>
          }
        />
      </Content>
    </Layout>
  );
}

export default NotFoundPage;
