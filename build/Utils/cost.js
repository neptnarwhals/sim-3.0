import { log10 } from "./helpers";
export function parseValue(val) {
    if (val === "Infinity")
        throw "Variable value reached Infinity";
    if (val === "0")
        return -Infinity;
    if (/[e]/.test(val))
        return log10(val);
    return Math.log10(Number(val));
}
export class BaseCost {
}
export class CompositeCost extends BaseCost {
    constructor(cutoff, cost1, cost2) {
        super();
        this.cutoff = cutoff;
        this.cost1 = cost1;
        this.cost2 = cost2;
    }
    getCost(level) {
        return level < this.cutoff ? this.cost1.getCost(level) : this.cost2.getCost(level - this.cutoff);
    }
}
export class ExponentialCost extends BaseCost {
    /**
     * ExponentialCost constructor
     * @param {number} base BaseCost of the variable
     * @param {number} costInc Cost Increase of the variable
     * @param {boolean} log2 States whether the cost increase is log2 or not - optional, default: false
     */
    constructor(base, costInc, log2 = false) {
        super();
        this.cost = parseValue(String(base));
        this.costInc = parseValue(String(costInc));
        if (log2)
            this.costInc = Math.log10(2) * Math.pow(10, this.costInc);
    }
    getCost(level) {
        return this.cost + this.costInc * level;
    }
}
export class StepwiseCost extends BaseCost {
    constructor(stepLength, cost) {
        super();
        this.stepLength = stepLength;
        this.cost = cost;
    }
    getCost(level) {
        return this.cost.getCost(Math.floor(level / this.stepLength));
    }
}
export class ConstantCost extends BaseCost {
    constructor(base) {
        super();
        this.cost = parseValue(String(base));
    }
    getCost(level) {
        return this.cost;
    }
}
export class FirstFreeCost extends BaseCost {
    constructor(trueCost) {
        super();
        this.trueCost = trueCost;
    }
    getCost(level) {
        return this.trueCost.getCost(level - 1);
    }
}
