import { makeAutoObservable } from 'mobx';
import type { MonthlyClimate, UserInputs, MonthResult, YearSummary, City } from '../types';
import { calculateVentilationEnergy, calculateCoolingSavings, type CoolingSavingsResult } from '../lib/calculations';
import { searchCities, fetchMonthlyClimate } from '../lib/climateApi';

export const defaultUserInputs: UserInputs = {
  airflow: 320,
  indoorSetpoint: 20,
  heatRecoveryEfficiency: 50,
  baseElectricityConsumptionPerMonth: 300,
  tierThresholdKWhPerMonth: 600,
  electricityPriceBelowThreshold: 5.93,
  electricityPriceAboveThreshold: 9.775,
  gasPricePerM3: 8.25,
  heatRecoveryCapex: 42000,
  // Cooling season defaults
  coolingCOP: 3.2,
  coolingHoursPerDay: 24,
  coolingDaysPerSeason: 90,
};

export class VentilationStore {
  // observable state
  userInputs: UserInputs = { ...defaultUserInputs };
  selectedCity: City | null = null;
  monthlyClimate: MonthlyClimate[] = [];
  isLoadingClimate = false;
  climateError: string | null = null;

  // last calculation results
  perMonth: MonthResult[] = [];
  yearly: YearSummary | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setUserInput<K extends keyof UserInputs>(key: K, value: UserInputs[K]) {
    this.userInputs[key] = value;
    this.recalculate();
  }

  async searchCitiesByName(query: string): Promise<City[]> {
    return searchCities(query);
  }

  async selectCity(city: City) {
    this.selectedCity = city;
    await this.loadClimate();
  }

  async loadClimate() {
    if (!this.selectedCity) return;
    this.isLoadingClimate = true;
    this.climateError = null;
    try {
      this.monthlyClimate = await fetchMonthlyClimate(
        this.selectedCity.latitude,
        this.selectedCity.longitude,
      );
      this.recalculate();
    } catch {
      this.climateError = 'Ошибка загрузки климатических данных';
      this.perMonth = [];
      this.yearly = null;
    } finally {
      this.isLoadingClimate = false;
    }
  }

  recalculate() {
    if (!this.monthlyClimate.length) {
      this.perMonth = [];
      this.yearly = null;
      return;
    }
    const { perMonth, yearly } = calculateVentilationEnergy(this.monthlyClimate, this.userInputs);
    this.perMonth = perMonth;
    this.yearly = yearly;
  }

  // computed helpers
  get hasResults() {
    return !!this.yearly && this.perMonth.length > 0;
  }

  // Cooling savings computed
  get coolingSavings(): CoolingSavingsResult | null {
    if (!this.monthlyClimate.length) return null;
    return calculateCoolingSavings(this.monthlyClimate, this.userInputs);
  }
}
