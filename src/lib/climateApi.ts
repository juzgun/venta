import type { City, MonthlyClimate } from '../types';
import { MONTH_NAMES_RU } from './calculations';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
// Используем архивный Open-Meteo API с дневными средними за один год и сами считаем месячные
const ARCHIVE_ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive';

export async function searchCities(query: string): Promise<City[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(GEOCODING_ENDPOINT);
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '10');
  url.searchParams.set('language', 'ru');
  url.searchParams.set('country', 'RU');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to search cities');
  }

  const data = await res.json();

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cities: City[] = data.results.map((item: any) => ({
    name: item.name as string,
    country: item.country as string,
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    region: item.admin1 as string,
  }));

  return cities;
}

export async function fetchMonthlyClimate(lat: number, lon: number): Promise<MonthlyClimate[]> {
  const url = new URL(ARCHIVE_ENDPOINT);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  // Берём длительный период (2010–2020) для усреднения климата
  // 11 лет достаточно для сглаживания случайных аномалий и при этом даёт стабильный ответ API
  url.searchParams.set('start_date', '2010-01-01');
  url.searchParams.set('end_date', '2021-12-31');
  url.searchParams.set('daily', 'temperature_2m_mean');
  url.searchParams.set('timezone', 'GMT');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Ошибка при загрузке данных о климатических условиях');
  }

  const data = await res.json();
  const times: string[] | undefined = data?.daily?.time;
  const temps: number[] | undefined = data?.daily?.temperature_2m_mean;

  if (
    !times ||
    !Array.isArray(times) ||
    !temps ||
    !Array.isArray(temps) ||
    times.length !== temps.length ||
    times.length === 0
  ) {
    throw new Error('Некорректные данные о климатических условиях');
  }

  const sums = new Array<number>(12).fill(0);
  const counts = new Array<number>(12).fill(0);

  for (let i = 0; i < times.length; i++) {
    const t = temps[i];
    if (!Number.isFinite(t)) continue;

    const d = new Date(times[i]);
    const m = d.getUTCMonth(); // 0-11
    if (m >= 0 && m < 12) {
      sums[m] += t;
      counts[m] += 1;
    }
  }

  const monthly: MonthlyClimate[] = [];
  for (let m = 0; m < 12; m++) {
    const mean = counts[m] > 0 ? sums[m] / counts[m] : 0;
    monthly.push({
      monthIndex: m,
      monthNameRu: MONTH_NAMES_RU[m] ?? `${m + 1}`,
      tOut: mean,
    });
  }

  return monthly;
}
