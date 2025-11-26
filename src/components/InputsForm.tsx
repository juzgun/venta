import React from 'react';
import { observer } from 'mobx-react-lite';
import { Form, InputNumber, Card, Row, Col, Typography } from 'antd';
import type { UserInputs } from '../types';
import { useStores } from '../stores/StoreContext';

const { Title } = Typography;

type FormValues = UserInputs;

export const InputsForm: React.FC = observer(() => {
  const { ventilationStore: store } = useStores();

  const [form] = Form.useForm<FormValues>();

  const handleValuesChange = (_changed: Partial<FormValues>, allValues: FormValues) => {
    (Object.keys(allValues) as (keyof FormValues)[]).forEach((key) => {
      const value = allValues[key];
      if (value !== undefined) {
        store.setUserInput(key, value);
      }
    });
  };

  return (
    <Card>
      <Title level={4}>Параметры вентиляции и тарифы</Title>
      <Form<FormValues>
        layout='vertical'
        form={form}
        initialValues={store.userInputs}
        onValuesChange={handleValuesChange}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label='Расход воздуха, м³/ч'
              name='airflow'
              rules={[{ required: true, message: 'Укажите расход воздуха' }]}
            >
              <InputNumber min={50} max={2000} step={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label='Температура внутри, °C'
              name='indoorSetpoint'
              rules={[{ required: true, message: 'Укажите температуру' }]}
            >
              <InputNumber min={15} max={30} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label='Эффективность рекуперации, %'
              name='heatRecoveryEfficiency'
              rules={[{ required: true, message: 'Укажите эффективность' }]}
            >
              <InputNumber min={0} max={95} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label='Базовое потребление дома, кВт·ч/мес'
              name='baseElectricityConsumptionPerMonth'
              rules={[{ required: true, message: 'Укажите базовое потребление' }]}
            >
              <InputNumber min={0} max={5000} step={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label='Порог дешёвого тарифа, кВт·ч/мес'
              name='tierThresholdKWhPerMonth'
              rules={[{ required: true, message: 'Укажите порог' }]}
            >
              <InputNumber min={0} max={10000} step={50} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label='Цена эл-ва ниже порога, ₽/кВт·ч (если нет порога, указать среднесуточную цену)'
              name='electricityPriceBelowThreshold'
              rules={[{ required: true, message: 'Укажите тариф' }]}
            >
              <InputNumber min={0} max={50} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label='Цена эл-ва выше порога, ₽/кВт·ч (если нет порога, указать равное "Цена эл-ва ниже порога"'
              name='electricityPriceAboveThreshold'
              rules={[{ required: true, message: 'Укажите тариф' }]}
            >
              <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label='Цена газа, ₽/м³'
              name='gasPricePerM3'
              rules={[{ required: true, message: 'Укажите цену газа' }]}
            >
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label='ЦЕНА рекуператора, ₽ (опционально)' name='heatRecoveryCapex'>
              <InputNumber min={0} max={5_000_000} step={1000} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
});
