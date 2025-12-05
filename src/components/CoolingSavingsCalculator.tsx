import React from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Row, Col, Statistic, Typography, Form, InputNumber, Alert, Divider, Tag } from 'antd';
import { useStores } from '../stores/StoreContext';
import { DAYS_IN_MONTH } from '../lib/calculations';

const { Title, Text } = Typography;

// Constants for cooling calculations
const AIR_DENSITY = 1.16; // kg/m³ at ~30°C
const SPECIFIC_HEAT = 1.0; // kJ/(kg·K)

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

interface CoolingResults {
  avgSummerTemp: number;
  massFlow: number;
  deltaTWithout: number;
  qWithout: number;
  tInlet: number;
  deltaTWith: number;
  qWith: number;
  qSaved: number;
  powerWithout: number;
  powerWith: number;
  powerSaved: number;
  costHourWithout: number;
  costHourWith: number;
  savingsHour: number;
  savingsDay: number;
  savingsMonth: number;
  savingsSeason: number;
}

function calculateCoolingDetails(
  airflow: number,
  tOut: number,
  tIn: number,
  efficiency: number,
  cop: number,
  tariff: number,
  hoursPerDay: number,
  daysPerSeason: number
): CoolingResults {
  // Mass flow: m = (airflow in m³/h) × density / 3600
  const massFlow = (airflow * AIR_DENSITY) / 3600;

  // ΔT without recuperation
  const deltaTWithout = tOut - tIn;

  // Cooling without recuperation: Q = m·c·ΔT (result in kW)
  const qWithout = massFlow * SPECIFIC_HEAT * Math.max(0, deltaTWithout);

  // Inlet temperature after recuperation
  const tInlet = tOut - (efficiency / 100) * deltaTWithout;

  // ΔT with recuperation
  const deltaTWith = tInlet - tIn;

  // Cooling with recuperation
  const qWith = massFlow * SPECIFIC_HEAT * Math.max(0, deltaTWith);

  // Cooling saved
  const qSaved = qWithout - qWith;

  // Electrical power
  const powerWithout = qWithout / cop;
  const powerWith = qWith / cop;
  const powerSaved = powerWithout - powerWith;

  // Cost per hour
  const costHourWithout = powerWithout * tariff;
  const costHourWith = powerWith * tariff;
  const savingsHour = costHourWithout - costHourWith;

  // Total savings
  const savingsDay = savingsHour * hoursPerDay;
  const savingsMonth = savingsDay * 30;
  const savingsSeason = savingsDay * daysPerSeason;

  return {
    avgSummerTemp: tOut,
    massFlow,
    deltaTWithout,
    qWithout,
    tInlet,
    deltaTWith,
    qWith,
    qSaved,
    powerWithout,
    powerWith,
    powerSaved,
    costHourWithout,
    costHourWith,
    savingsHour,
    savingsDay,
    savingsMonth,
    savingsSeason,
  };
}

export const CoolingSavingsCalculator: React.FC = observer(() => {
  const {
    ventilationStore: { userInputs, setUserInput, monthlyClimate, hasResults },
  } = useStores();

  // Find months where cooling is needed (ΔT < 0, i.e., tOut > indoorSetpoint)
  const coolingData = React.useMemo(() => {
    if (!monthlyClimate.length) return null;
    
    // Filter months where outdoor temp > indoor setpoint (negative ΔT for heating = cooling needed)
    const coolingMonths = monthlyClimate.filter((m) => m.tOut > userInputs.indoorSetpoint);
    
    if (coolingMonths.length === 0) return null;
    
    // Calculate average temperature from cooling months
    const avgTemp = coolingMonths.reduce((acc, m) => acc + m.tOut, 0) / coolingMonths.length;
    
    // Calculate total days in cooling season
    const totalDays = coolingMonths.reduce((acc, m) => acc + (DAYS_IN_MONTH[m.monthIndex] ?? 30), 0);
    
    return {
      months: coolingMonths,
      avgTemp,
      totalDays,
    };
  }, [monthlyClimate, userInputs.indoorSetpoint]);

  // Calculate cooling savings details for display
  const results = React.useMemo(() => {
    if (!coolingData) return null;
    
    return calculateCoolingDetails(
      userInputs.airflow,
      coolingData.avgTemp,
      userInputs.indoorSetpoint,
      userInputs.heatRecoveryEfficiency,
      userInputs.coolingCOP,
      userInputs.electricityPriceBelowThreshold,
      userInputs.coolingHoursPerDay,
      coolingData.totalDays
    );
  }, [
    coolingData,
    userInputs.airflow,
    userInputs.indoorSetpoint,
    userInputs.heatRecoveryEfficiency,
    userInputs.coolingCOP,
    userInputs.electricityPriceBelowThreshold,
    userInputs.coolingHoursPerDay,
  ]);

  if (!hasResults) {
    return (
      <Card>
        <Title level={4}>💨 Экономия на охлаждении (сезон охлаждения)</Title>
        <Alert
          type='info'
          message='Выберите город и введите параметры, чтобы увидеть расчёт экономии на охлаждении.'
        />
      </Card>
    );
  }

  if (!coolingData) {
    return (
      <Card>
        <Title level={4}>💨 Экономия рекуператора на охлаждении</Title>
        <Alert
          type='info'
          message={`В выбранном городе нет месяцев, где наружная температура превышает ${userInputs.indoorSetpoint}°C. Охлаждение не требуется.`}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>💨 Экономия рекуператора на охлаждении (сезон охлаждения)</Title>
      
      {/* Cooling-specific inputs */}
      <div style={{ marginBottom: 24 }}>
        <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
          Дополнительные параметры для расчёта охлаждения:
        </Text>
        <Form layout='vertical'>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label='COP кондиционеров'>
                <InputNumber
                  min={1}
                  max={10}
                  step={0.1}
                  value={userInputs.coolingCOP}
                  onChange={(val) => setUserInput('coolingCOP', val ?? 3.2)}
                  style={{ width: '100%' }}
                  addonAfter='коэфф.'
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label='Часов работы в день'>
                <InputNumber
                  min={1}
                  max={24}
                  step={1}
                  value={userInputs.coolingHoursPerDay}
                  onChange={(val) => setUserInput('coolingHoursPerDay', val ?? 10)}
                  style={{ width: '100%' }}
                  addonAfter='ч/день'
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {results && (
        <>
          {/* Source data info */}
          <Alert
            type='info'
            message={
              <div>
                <div style={{ marginBottom: 8 }}>
                  Данные из основных параметров: расход воздуха <strong>{userInputs.airflow} м³/ч</strong>,
                  КПД рекуператора <strong>{userInputs.heatRecoveryEfficiency}%</strong>,
                  температура внутри <strong>{userInputs.indoorSetpoint}°C</strong>,
                  тариф <strong>{userInputs.electricityPriceBelowThreshold} ₽/кВт·ч</strong>.
                </div>
                <div style={{ marginBottom: 8 }}>
                  Месяцы с охлаждением (Tнар {'>'} {userInputs.indoorSetpoint}°C):{' '}
                  {coolingData.months.map((m) => (
                    <Tag key={m.monthIndex} color='orange' style={{ marginBottom: 4 }}>
                      {m.monthNameRu} ({numberFormatter.format(m.tOut)}°C)
                    </Tag>
                  ))}
                </div>
                <div>
                  Средняя температура сезона: <strong>{numberFormatter.format(coolingData.avgTemp)}°C</strong>,
                  всего дней охлаждения: <strong>{coolingData.totalDays} дн.</strong>
                </div>
              </div>
            }
            style={{ marginBottom: 24 }}
          />

          <Divider orientation='left'>⚙️ Тепловая нагрузка</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Массовый расход'
                value={numberFormatter.format(results.massFlow)}
                suffix='кг/с'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='ΔT без рекуперации'
                value={numberFormatter.format(results.deltaTWithout)}
                suffix='K (°C)'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Холод без рекуп.'
                value={numberFormatter.format(results.qWithout)}
                suffix='кВт'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='T приток после рекуп.'
                value={numberFormatter.format(results.tInlet)}
                suffix='°C'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='ΔT с рекуперацией'
                value={numberFormatter.format(results.deltaTWith)}
                suffix='K (°C)'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Холод с рекуп.'
                value={numberFormatter.format(results.qWith)}
                suffix='кВт'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Сэкономлено холода'
                value={numberFormatter.format(results.qSaved)}
                suffix={`кВт (~${Math.round((results.qSaved / results.qWithout) * 100) || 0}%)`}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>

          <Divider orientation='left'>⚡ Электрическая мощность</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Электричество без рекуп.'
                value={numberFormatter.format(results.powerWithout)}
                suffix='кВт'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Электричество с рекуп.'
                value={numberFormatter.format(results.powerWith)}
                suffix='кВт'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Экономия мощности'
                value={numberFormatter.format(results.powerSaved)}
                suffix='кВт·ч/ч'
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Стоимость без рекуп./час'
                value={numberFormatter.format(results.costHourWithout)}
                suffix='₽/ч'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Стоимость с рекуп./час'
                value={numberFormatter.format(results.costHourWith)}
                suffix='₽/ч'
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title='Экономия в час'
                value={numberFormatter.format(results.savingsHour)}
                suffix='₽/ч'
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>

          <Divider orientation='left'>💰 Итоговая экономия</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card
                size='small'
                style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' }}
              >
                <Statistic
                  title='Экономия в сутки'
                  value={numberFormatter.format(results.savingsDay)}
                  suffix='₽/день'
                  valueStyle={{ color: '#27ae60', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                size='small'
                style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' }}
              >
                <Statistic
                  title='Экономия в месяц'
                  value={currencyFormatter.format(results.savingsMonth)}
                  valueStyle={{ color: '#27ae60', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                size='small'
                style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' }}
              >
                <Statistic
                  title={`Экономия за сезон (${coolingData.totalDays} дн.)`}
                  value={currencyFormatter.format(results.savingsSeason)}
                  valueStyle={{ color: '#27ae60', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>

          <Alert
            type='warning'
            message={
              <span>
                <strong>ℹ️ Важно:</strong> Расчёт показывает экономию только на охлаждении 
                приточного воздуха. Общая экономия электричества в летний сезон может быть 
                выше благодаря снижению времени работы всей системы кондиционирования.
              </span>
            }
            style={{ marginTop: 24 }}
          />
        </>
      )}
    </Card>
  );
});

