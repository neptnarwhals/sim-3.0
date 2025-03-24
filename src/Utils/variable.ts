import { add, subtract } from "./helpers.js";
import { parseValue, BaseCost} from "./cost";

interface variableData {
  level?: number;
  cost: BaseCost;
  varBase?: number;
  value?: number | string;
  stepwisePowerSum?: { default?: boolean; length?: number; base?: number };
  firstFreeCost?: boolean;
}

export default class Variable {
  data: variableData;
  level: number;
  cost: number;
  value: number;
  stepwisePowerSum: { default?: boolean; length: number; base: number };
  varBase: number;
  firstFreeCost: number;
  isZero: boolean;

  constructor(data: variableData) {
    this.data = data;
    this.level = 0;
    this.cost = 0;
    this.value = 0;
    this.isZero = false;
    this.stepwisePowerSum = { length: 0, base: 0 };
    this.varBase = 0;
    this.firstFreeCost = 0;
    this.init();
  }
  init() {
    this.level = this.data.level ?? 0;
    this.cost = this.data.cost.getCost(this.level);
    this.value = typeof this.data.value === "number" || typeof this.data.value === "string" ? parseValue(String(this.data.value)) : 0;
    this.isZero = false;
    if (this.value === -Infinity) {
      this.value = 0;
      this.isZero = true;
    }
    this.stepwisePowerSum =
      this.data.stepwisePowerSum?.default === true
        ? { base: 2, length: 10 }
        : typeof this.data.stepwisePowerSum?.base === "number" && typeof this.data.stepwisePowerSum?.length === "number"
        ? { base: this.data.stepwisePowerSum.base, length: this.data.stepwisePowerSum.length }
        : { base: 0, length: 0 };
    this.varBase = this.data.varBase ? this.data.varBase : 10;
    this.firstFreeCost = this.data.firstFreeCost === true ? 1 : 0;
    if (this.data.firstFreeCost) this.buy();
  }
  buy() {
    if (this.stepwisePowerSum.base !== 0) {
      this.value = this.isZero
        ? Math.log10(this.stepwisePowerSum.base) * Math.floor(this.level / this.stepwisePowerSum.length)
        : add(this.value, Math.log10(this.stepwisePowerSum.base) * Math.floor(this.level / this.stepwisePowerSum.length));
      this.isZero = false;
    } else this.value = Math.log10(this.varBase) * (this.level + 1);
    this.level++;
    this.cost = this.data.cost.getCost(this.level - this.firstFreeCost);
  }
  getCostForLevel(level: number) {
    return this.data.cost.getCost(level - this.firstFreeCost);
  }
  reCalculate() {
    if (this.stepwisePowerSum.base !== 0) {
      const intPart = Math.floor(this.level / this.stepwisePowerSum.length);
      const modPart = this.level - intPart * this.stepwisePowerSum.length;
      const d = this.stepwisePowerSum.length / (this.stepwisePowerSum.base - 1);
      this.value = subtract(Math.log10(d + modPart) + Math.log10(this.stepwisePowerSum.base) * intPart, Math.log10(d));
    } else this.value = Math.log10(this.varBase) * this.level;
  }
  reset() {
    this.init();
  }
}
