import type { MonthlyClimate, UserInputs, MonthResult, YearSummary } from '../types';

export const AIR_HEAT_CAPACITY_COEFF = 0.000335; // kW per (m³/h·K)
export const NATURAL_GAS_LHV_KWH_PER_M3 = 9.3; // kWh/m³
export const BOILER_EFFICIENCY = 0.96;
export const EFFECTIVE_KWH_PER_M3_GAS = NATURAL_GAS_LHV_KWH_PER_M3 * BOILER_EFFICIENCY;

// Constants for cooling calculations
const AIR_DENSITY = 1.16; // kg/m³ at ~30°C
const SPECIFIC_HEAT = 1.0; // kJ/(kg·K)

export const DAYS_IN_MONTH: number[] = [
  31, // Январь
  28, // Февраль
  31, // Март
  30, // Апрель
  31, // Май
  30, // Июнь
  31, // Июль
  31, // Август
  30, // Сентябрь
  31, // Октябрь
  30, // Ноябрь
  31, // Декабрь
];

export const HOURS_IN_MONTH: number[] = [
  744, // Январь
  672, // Февраль
  744, // Март
  720, // Апрель
  744, // Май
  720, // Июнь
  744, // Июль
  744, // Август
  720, // Сентябрь
  744, // Октябрь
  720, // Ноябрь
  744, // Декабрь
];

export const MONTH_NAMES_RU: string[] = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export function calculateVentilationEnergy(
  months: MonthlyClimate[],
  inputs: UserInputs,
): { perMonth: MonthResult[]; yearly: YearSummary } {
  const perMonth: MonthResult[] = months.map((climate) => {
    const { monthIndex, monthNameRu, tOut } = climate;

    const deltaT = inputs.indoorSetpoint - tOut;
    const effectiveDeltaT = Math.max(0, deltaT);

    const pNoRecKW = AIR_HEAT_CAPACITY_COEFF * inputs.airflow * effectiveDeltaT;

    const pWithRecKW = pNoRecKW * (1 - inputs.heatRecoveryEfficiency / 100);

    const hours = HOURS_IN_MONTH[monthIndex] ?? 0;
    const eNoRecKWh = pNoRecKW * hours;
    const eWithRecKWh = pWithRecKW * hours;

    const totalNoRecKWh = inputs.baseElectricityConsumptionPerMonth + eNoRecKWh;
    const totalWithRecKWh = inputs.baseElectricityConsumptionPerMonth + eWithRecKWh;

    const calcElectricityCostForMonth = (totalKWh: number): number => {
      const below = Math.min(totalKWh, inputs.tierThresholdKWhPerMonth);
      const above = Math.max(0, totalKWh - inputs.tierThresholdKWhPerMonth);
      return (
        below * inputs.electricityPriceBelowThreshold +
        above * inputs.electricityPriceAboveThreshold
      );
    };

    const electricCostNoRec = calcElectricityCostForMonth(totalNoRecKWh);
    const electricCostWithRec = calcElectricityCostForMonth(totalWithRecKWh);

    return {
      monthIndex,
      monthNameRu,
      tOut,
      deltaT,
      effectiveDeltaT,
      pNoRecKW,
      pWithRecKW,
      eNoRecKWh,
      eWithRecKWh,
      totalNoRecKWh,
      totalWithRecKWh,
      electricCostNoRec,
      electricCostWithRec,
    };
  });

  const yearVentNoRecKWh = perMonth.reduce((sum, m) => sum + m.eNoRecKWh, 0);
  const yearVentWithRecKWh = perMonth.reduce((sum, m) => sum + m.eWithRecKWh, 0);
  const yearElectricCostNoRec = perMonth.reduce((sum, m) => sum + m.electricCostNoRec, 0);
  const yearElectricCostWithRec = perMonth.reduce((sum, m) => sum + m.electricCostWithRec, 0);

  const costPerKWhGas = inputs.gasPricePerM3 / EFFECTIVE_KWH_PER_M3_GAS;

  const gasCostNoRecYear = yearVentNoRecKWh * costPerKWhGas;
  const gasCostWithRecYear = yearVentWithRecKWh * costPerKWhGas;

  const electricKWhSaved = yearVentNoRecKWh - yearVentWithRecKWh;
  const electricMoneySaved = yearElectricCostNoRec - yearElectricCostWithRec;
  const gasMoneySaved = gasCostNoRecYear - gasCostWithRecYear;
  
  let paybackYearsElectric: number | undefined;
  if (inputs.heatRecoveryCapex && electricMoneySaved > 0) {
    paybackYearsElectric = inputs.heatRecoveryCapex / electricMoneySaved;
  }

  let paybackYearsGas: number | undefined;
  if (inputs.heatRecoveryCapex && gasMoneySaved > 0) {
    paybackYearsGas = inputs.heatRecoveryCapex / gasMoneySaved;
  }

  const yearly: YearSummary = {
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
  };

  return { perMonth, yearly };
}

// Cooling savings calculation
export interface CoolingSavingsResult {
  coolingMonths: MonthlyClimate[];
  avgTemp: number;
  totalDays: number;
  savingsSeason: number; // RUB per season
}

export function calculateCoolingSavings(
  months: MonthlyClimate[],
  inputs: UserInputs
): CoolingSavingsResult | null {
  // Filter months where outdoor temp > indoor setpoint (cooling needed)
  const coolingMonths = months.filter((m) => m.tOut > inputs.indoorSetpoint);
  
  if (coolingMonths.length === 0) return null;
  
  // Calculate average temperature from cooling months
  const avgTemp = coolingMonths.reduce((acc, m) => acc + m.tOut, 0) / coolingMonths.length;
  
  // Calculate total days in cooling season
  const totalDays = coolingMonths.reduce((acc, m) => acc + (DAYS_IN_MONTH[m.monthIndex] ?? 30), 0);
  
  // Mass flow: m = (airflow in m³/h) × density / 3600
  const massFlow = (inputs.airflow * AIR_DENSITY) / 3600;
  
  // ΔT without recuperation
  const deltaTWithout = avgTemp - inputs.indoorSetpoint;
  
  // Cooling without recuperation: Q = m·c·ΔT (result in kW)
  const qWithout = massFlow * SPECIFIC_HEAT * Math.max(0, deltaTWithout);
  
  // Inlet temperature after recuperation
  const tInlet = avgTemp - (inputs.heatRecoveryEfficiency / 100) * deltaTWithout;
  
  // ΔT with recuperation
  const deltaTWith = tInlet - inputs.indoorSetpoint;
  
  // Cooling with recuperation
  const qWith = massFlow * SPECIFIC_HEAT * Math.max(0, deltaTWith);
  
  // Cooling saved
  const qSaved = qWithout - qWith;
  
  // Electrical power saved
  const powerSaved = qSaved / inputs.coolingCOP;
  
  // Cost savings per hour
  const savingsHour = powerSaved * inputs.electricityPriceBelowThreshold;
  
  // Total savings per season
  const savingsDay = savingsHour * inputs.coolingHoursPerDay;
  const savingsSeason = savingsDay * totalDays;
  
  return {
    coolingMonths,
    avgTemp,
    totalDays,
    savingsSeason,
  };
}
