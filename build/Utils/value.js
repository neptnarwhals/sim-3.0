import { add, subtract } from "./helpers";
export class BaseValue {
    constructor(varBase = 10) {
        this.varBase = varBase;
    }
}
export class StepwisePowerSumValue extends BaseValue {
    constructor(base = 2, length = 10, varBase = 10) {
        super(varBase);
        this.base = base;
        this.length = length;
    }
    computeNewValue(prevValue, currentLevel, isZero) {
        let toAdd = Math.log10(this.base) * Math.floor(currentLevel / this.length);
        return isZero ? toAdd : add(prevValue, toAdd);
    }
    recomputeValue(level) {
        const intPart = Math.floor(level / this.length);
        const modPart = level - intPart * this.length;
        const d = this.length / (this.base - 1);
        return subtract(Math.log10(d + modPart) + Math.log10(this.base) * intPart, Math.log10(d));
    }
}
export class LinearValue extends BaseValue {
    computeNewValue(prevValue, currentLevel, isZero) {
        return Math.log10(this.varBase) * (currentLevel + 1);
    }
    recomputeValue(level) {
        return Math.log10(this.varBase) * level;
    }
}
