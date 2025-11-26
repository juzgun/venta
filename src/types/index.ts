export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface MonthlyClimate {
  monthIndex: number; // 0-11
  monthNameRu: string; // "Январь", ...
  tOut: number; // °C
}

export interface UserInputs {
  airflow: number; // m³/h
  indoorSetpoint: number; // °C
  heatRecoveryEfficiency: number; // %
  baseElectricityConsumptionPerMonth: number; // kWh/month
  tierThresholdKWhPerMonth: number; // kWh
  electricityPriceBelowThreshold: number; // RUB/kWh
  electricityPriceAboveThreshold: number; // RUB/kWh
  gasPricePerM3: number; // RUB/m³
  heatRecoveryCapex?: number; // RUB, optional
}

export interface MonthResult {
  monthIndex: number;
  monthNameRu: string;
  tOut: number;
  deltaT: number;
  effectiveDeltaT: number;
  pNoRecKW: number;
  pWithRecKW: number;
  eNoRecKWh: number;
  eWithRecKWh: number;
  totalNoRecKWh: number;
  totalWithRecKWh: number;
  electricCostNoRec: number;
  electricCostWithRec: number;
}

export interface YearSummary {
  yearVentNoRecKWh: number;
  yearVentWithRecKWh: number;
  yearElectricCostNoRec: number;
  yearElectricCostWithRec: number;
  electricKWhSaved: number;
  electricMoneySaved: number;
  gasCostNoRecYear: number;
  gasCostWithRecYear: number;
  costPerKWhGas: number;
  paybackYearsElectric?: number;
  paybackYearsGas?: number;
}
