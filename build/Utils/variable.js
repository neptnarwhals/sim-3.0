import { add } from "./helpers.js";
import { parseValue, FirstFreeCost } from "./cost";
import { LinearValue } from "./value";
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
        if (this.data.valueScaling) {
            // If custom class is passed, we will use that.
            this.valueCompute = this.data.valueScaling;
        }
        else {
            // Otherwise, we will create the default classes to handle this.
            let varBase = this.data.varBase ? this.data.varBase : 10;
            this.valueCompute = new LinearValue(varBase);
        }
        if (this.data.cost instanceof FirstFreeCost && this.level == 0) {
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
    getCostForLevels(from, to) {
        let totalCost = this.getCostForLevel(from);
        for (let i = from + 1; i <= to; i++) {
            totalCost = add(totalCost, this.getCostForLevel(i));
        }
        return totalCost;
    }
    reCalculate() {
        this.value = this.valueCompute.recomputeValue(this.level);
    }
    reset() {
        this.init();
    }
}
