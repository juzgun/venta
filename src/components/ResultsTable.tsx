import React from 'react';
import { observer } from 'mobx-react-lite';
import { Alert, Card, Table } from 'antd';
import type { TableProps } from 'antd';
import type { MonthResult } from '../types';
import { useStores } from '../stores/StoreContext';

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});

const energyFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export const ResultsTable: React.FC = observer(() => {
  const { ventilationStore: store } = useStores();

  const columns: TableProps<MonthResult>['columns'] = [
    {
      title: 'Месяц',
      dataIndex: 'monthNameRu',
      key: 'month',
    },
    {
      title: 'Tнаруж, °C',
      dataIndex: 'tOut',
      key: 'tOut',
      align: 'right',
      render: (value: number) => numberFormatter.format(value),
    },
    {
      title: 'ΔT, °C',
      dataIndex: 'deltaT',
      key: 'deltaT',
      align: 'right',
      render: (value: number) => numberFormatter.format(value),
    },
    {
      title: 'Мощн. без рекуп., кВт',
      dataIndex: 'pNoRecKW',
      key: 'pNoRecKW',
      align: 'right',
      render: (value: number) => numberFormatter.format(value),
    },
    {
      title: 'Мощн. с рекуп., кВт',
      dataIndex: 'pWithRecKW',
      key: 'pWithRecKW',
      align: 'right',
      render: (value: number) => numberFormatter.format(value),
    },
    {
      title: 'Энергия без рекуп., кВт·ч',
      dataIndex: 'eNoRecKWh',
      key: 'eNoRecKWh',
      align: 'right',
      render: (value: number) => energyFormatter.format(value),
    },
    {
      title: 'Энергия с рекуп., кВт·ч',
      dataIndex: 'eWithRecKWh',
      key: 'eWithRecKWh',
      align: 'right',
      render: (value: number) => energyFormatter.format(value),
    },
    {
      title: 'Всего эл-во без рекуп., кВт·ч',
      dataIndex: 'totalNoRecKWh',
      key: 'totalNoRecKWh',
      align: 'right',
      render: (value: number) => energyFormatter.format(value),
    },
    {
      title: 'Всего эл-во с рекуп., кВт·ч',
      dataIndex: 'totalWithRecKWh',
      key: 'totalWithRecKWh',
      align: 'right',
      render: (value: number) => energyFormatter.format(value),
    },
    {
      title: 'Стоимость без рекуп., ₽',
      dataIndex: 'electricCostNoRec',
      key: 'electricCostNoRec',
      align: 'right',
      render: (value: number) => currencyFormatter.format(value),
    },
    {
      title: 'Стоимость с рекуп., ₽',
      dataIndex: 'electricCostWithRec',
      key: 'electricCostWithRec',
      align: 'right',
      render: (value: number) => currencyFormatter.format(value),
    },
  ];

  return (
    <Card>
      {store.climateError && (
        <Alert type='error' message={store.climateError} style={{ marginBottom: 16 }} />
      )}
      <Table<MonthResult>
        size='small'
        loading={store.isLoadingClimate}
        dataSource={store.perMonth}
        columns={columns}
        rowKey={(row) => row.monthIndex}
        pagination={false}
        locale={{
          emptyText: 'Нет данных. Выберите город и укажите параметры.',
        }}
        scroll={{ x: 800 }}
      />
    </Card>
  );
});
