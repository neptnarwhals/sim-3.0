import { add, subtract } from "./helpers.js";
import { parseValue, FirstFreeCost } from "./cost";
class BaseValue {
    constructor(varBase = 10) {
        this.varBase = varBase;
    }
}
export class StepwisePowerSumValue extends BaseValue {
    constructor(varBase = 10, base = 2, length = 10) {
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
let placeholderValueCompute = new LinearValue(10);
export default class Variable {
    constructor(data) {
        this.data = data;
        this.level = 0;
        this.cost = 0;
        this.value = 0;
        this.isZero = false;
        this.valueCompute = placeholderValueCompute;
        this.init();
    }
    prepareStepwiseSum() {
        var _a;
        let stepwisePowerSum;
        if (((_a = this.data.stepwisePowerSum) === null || _a === void 0 ? void 0 : _a.default) === true) {
            stepwisePowerSum = { base: 2, length: 10 };
        }
        else if (this.data.stepwisePowerSum && typeof this.data.stepwisePowerSum.length == "number" && typeof this.data.stepwisePowerSum.base == "number") {
            stepwisePowerSum = { base: this.data.stepwisePowerSum.base, length: this.data.stepwisePowerSum.length };
        }
        return stepwisePowerSum;
    }
    init() {
        var _a;
        this.level = (_a = this.data.level) !== null && _a !== void 0 ? _a : 0;
        this.cost = this.data.cost.getCost(this.level);
        this.value = typeof this.data.value === "number" || typeof this.data.value === "string" ? parseValue(String(this.data.value)) : 0;
        if (this.value === -Infinity) {
            this.value = 0;
            this.isZero = true;
        }
        else {
            this.isZero = false;
        }
        let varBase = this.data.varBase ? this.data.varBase : 10;
        let stepwisePowerSum = this.prepareStepwiseSum();
        this.valueCompute = stepwisePowerSum
            ? new StepwisePowerSumValue(varBase, stepwisePowerSum.base, stepwisePowerSum.length)
            : new LinearValue(varBase);
        if (this.data.cost instanceof FirstFreeCost) {
            this.buy();
        }
    }
    buy() {
        this.value = this.valueCompute.computeNewValue(this.value, this.level, this.isZero);
        this.isZero = false;
        this.level++;
        this.cost = this.data.cost.getCost(this.level);
    }
    getCostForLevel(level) {
        return this.data.cost.getCost(level);
    }
    reCalculate() {
        this.value = this.valueCompute.recomputeValue(this.level);
    }
    reset() {
        this.init();
    }
}
