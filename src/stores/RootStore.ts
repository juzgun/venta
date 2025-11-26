import { VentilationStore } from "./VentilationStore";

export class RootStore {
  ventilationStore: VentilationStore;

  constructor() {
    this.ventilationStore = new VentilationStore();
  }
}

export const rootStore = new RootStore();



