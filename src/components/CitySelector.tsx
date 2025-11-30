import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Select, Typography } from 'antd';
import type { SelectProps } from 'antd';
import { useStores } from '../stores/StoreContext';
import type { City } from '../types';

const { Text } = Typography;

export const CitySelector: React.FC = observer(() => {
  const { ventilationStore: store } = useStores();
  const [optionsCities, setOptionsCities] = useState<City[]>([]);
  const [fetching, setFetching] = useState(false);

  const handleSearch: SelectProps['onSearch'] = async (value) => {
    const query = value.trim();
    if (query.length < 2) {
      setOptionsCities([]);
      return;
    }
    try {
      setFetching(true);
      const cities = await store.searchCitiesByName(query);
      setOptionsCities(cities);
    } catch {
      // ignore search errors, they will just show empty list
      setOptionsCities([]);
    } finally {
      setFetching(false);
    }
  };

  const handleSelect: SelectProps['onSelect'] = async (value) => {
    const index = Number(value);
    const city = optionsCities[index];
    if (city) {
      await store.selectCity(city);
    }
  };

  const selectOptions = optionsCities.map((city, index) => ({
    value: String(index),
    label: `${city.name} (${city.country ?? ''} ${city.region ?? ''})`,
  }));

  return (
    <div style={{ marginBottom: 24 }}>
      <Text strong>Город (Россия)</Text>
      <Select
        showSearch
        allowClear
        placeholder='Начните вводить название города...'
        style={{ width: '100%', marginTop: 8 }}
        options={selectOptions}
        loading={fetching}
        filterOption={false}
        onSearch={handleSearch}
        onSelect={handleSelect}
        notFoundContent={fetching ? 'Загрузка...' : 'Ничего не найдено'}
      />
    </div>
  );
});
