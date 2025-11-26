import React from "react";
import { Layout, Typography, Row, Col } from "antd";
import { CitySelector } from "./components/CitySelector";
import { InputsForm } from "./components/InputsForm";
import { ResultsTable } from "./components/ResultsTable";
import { YearSummary } from "./components/YearSummary";
import "./index.css";

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const App: React.FC = () => {
  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          Расчёт энергопотребления приточной вентиляции с рекуперацией
        </Title>
        <Paragraph style={{ color: "#d9d9d9", margin: 0 }}>
          На основе климатических данных Open-Meteo для городов России
        </Paragraph>
      </Header>
      <Content className="app-content">
        <Row gutter={24}>
          <Col xs={24} md={10} lg={8}>
            <CitySelector />
            <InputsForm />
          </Col>
          <Col xs={24} md={14} lg={16}>
            <div style={{ marginBottom: 24 }}>
              <ResultsTable />
            </div>
            <YearSummary />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App;

