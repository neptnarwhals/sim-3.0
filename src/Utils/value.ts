import { add, subtract } from "./helpers";

export abstract class BaseValue {
    varBase: number;
    constructor(varBase: number = 10) {
        this.varBase = varBase;
    }
    abstract computeNewValue(prevValue: number, currentLevel: number, isZero: boolean): number;
    abstract recomputeValue(level: number): number;
}

export class StepwisePowerSumValue extends BaseValue {
    base: number;
    length: number;
    constructor(base: number = 2, length: number = 10, varBase: number = 10) {
        super(varBase);
        this.base = base;
        this.length = length;
    }
    computeNewValue(prevValue: number, currentLevel: number, isZero: boolean): number {
        let toAdd = Math.log10(this.base) * Math.floor(currentLevel / this.length);
        return isZero ? toAdd : add(prevValue, toAdd);
    }
    recomputeValue(level: number): number {
        const intPart = Math.floor(level / this.length);
        const modPart = level - intPart * this.length;
        const d = this.length / (this.base - 1);
        return subtract(Math.log10(d + modPart) + Math.log10(this.base) * intPart, Math.log10(d));
    }
}

export class LinearValue extends BaseValue {
    computeNewValue(prevValue: number, currentLevel: number, isZero: boolean): number {
        return Math.log10(this.varBase) * (currentLevel + 1);
    }
    recomputeValue(level: number): number {
        return Math.log10(this.varBase) * level;
    }
}