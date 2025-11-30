import React from 'react';
import { observer } from 'mobx-react-lite';
import { Alert, Card, Col, Row, Statistic, Typography } from 'antd';
import { useStores } from '../stores/StoreContext';

const { Title } = Typography;

const energyFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
});

export const YearSummary: React.FC = observer(() => {
  const {
    ventilationStore: { hasResults, yearly },
  } = useStores();

  if (!hasResults || !yearly) {
    return (
      <Card>
        <Alert
          type='info'
          message='Выберите город и введите параметры, чтобы увидеть годовой баланс.'
        />
      </Card>
    );
  }

  const {
    yearVentNoRecKWh,
    yearVentWithRecKWh,
    yearElectricCostNoRec,
    yearElectricCostWithRec,
    electricKWhSaved,
    electricMoneySaved,
    gasCostNoRecYear,
    gasCostWithRecYear,
    costPerKWhGas,
    paybackYearsElectric,
    paybackYearsGas,
  } = yearly;

  return (
    <Card>
      <Title level={4}>Годовой итог</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Statistic
            title='Энергия вентиляции без рекуператора, кВт·ч/год'
            value={energyFormatter.format(yearVentNoRecKWh)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Statistic
            title='Энергия вентиляции с рекуператором, кВт·ч/год'
            value={energyFormatter.format(yearVentWithRecKWh)}
          />
        </Col>

        <Col xs={24} md={12}>
          <Statistic
            title='Стоимость эл-ва без рекуператора, ₽/год'
            value={currencyFormatter.format(yearElectricCostNoRec)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Statistic
            title='Стоимость эл-ва с рекуператором, ₽/год'
            value={currencyFormatter.format(yearElectricCostWithRec)}
          />
        </Col>

        <Col xs={24} md={12}>
          <Statistic
            title='Экономия энергии, кВт·ч/год'
            value={energyFormatter.format(electricKWhSaved)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Statistic
            title='Экономия на электричестве, ₽/год'
            value={currencyFormatter.format(electricMoneySaved)}
          />
        </Col>

        <Col xs={24} md={12}>
          <Statistic
            title='Стоимость тепла на газу без рекуперации, ₽/год'
            value={currencyFormatter.format(gasCostNoRecYear)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Statistic
            title='Стоимость тепла на газу с рекуперацией, ₽/год'
            value={currencyFormatter.format(gasCostWithRecYear)}
          />
        </Col>

        <Col xs={24} md={12}>
          <Statistic
            title='Цена тепла из газа, ₽/кВт·ч'
            value={numberFormatter.format(costPerKWhGas)}
          />
        </Col>

        {paybackYearsElectric !== undefined && (
          <Col xs={24} md={12}>
            <Statistic
              title='Срок окупаемости рекуператора (ЭЛЕКТРИЧЕСТВО), лет'
              value={numberFormatter.format(paybackYearsElectric)}
            />
          </Col>
        )}

        {paybackYearsGas !== undefined && (
          <Col xs={24} md={12}>
            <Statistic
              title='Срок окупаемости рекуператора (ГАЗ), лет'
              value={numberFormatter.format(paybackYearsGas)}
            />
          </Col>
        )}
      </Row>
    </Card>
  );
});
