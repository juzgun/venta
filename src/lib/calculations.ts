import type { MonthlyClimate, UserInputs, MonthResult, YearSummary } from '../types';

export const AIR_HEAT_CAPACITY_COEFF = 0.000335; // kW per (m³/h·K)
export const NATURAL_GAS_LHV_KWH_PER_M3 = 9.3; // kWh/m³
export const BOILER_EFFICIENCY = 0.96;
export const EFFECTIVE_KWH_PER_M3_GAS = NATURAL_GAS_LHV_KWH_PER_M3 * BOILER_EFFICIENCY;

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
  if (inputs.heatRecoveryCapex && electricMoneySaved > 0) {
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
