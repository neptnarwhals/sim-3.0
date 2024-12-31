var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { global } from "../../Sim/main.js";
import { add, createResult, l10, subtract, sleep, binarySearch } from "../../Utils/helpers.js";
import Variable, { ExponentialCost, StepwiseCost, CompositeCost, ConstantCost } from "../../Utils/variable.js";
import { theoryClass } from "../theory.js";
import { c1Exp, getb, lookups, resolution, zeta } from "./helpers/RZ.js";
import goodzeros from "./helpers/RZgoodzeros.json" assert { type: "json" };
export default function rz(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield ((new rzSimWrap(data)).simulate());
    });
}
function mergeSortedLists(list1, list2) {
    let mergedList = [];
    let i = 0; // Pointer for list1
    let j = 0; // Pointer for list2
    // Merge lists while both have elements left
    while (i < list1.length && j < list2.length) {
        if (list1[i] <= list2[j]) {
            mergedList.push(list1[i]);
            i++;
        }
        else {
            mergedList.push(list2[j]);
            j++;
        }
    }
    // Add remaining elements from list1, if any
    while (i < list1.length) {
        mergedList.push(list1[i]);
        i++;
    }
    // Add remaining elements from list2, if any
    while (j < list2.length) {
        mergedList.push(list2[j]);
        j++;
    }
    return mergedList;
}
let rzZeros = mergeSortedLists(goodzeros.genericZeros, goodzeros.rzSpecificZeros);
let rzdZeros = mergeSortedLists(goodzeros.genericZeros, goodzeros.rzdSpecificZeros);
class rzSim extends theoryClass {
    getBuyingConditions() {
        const activeStrat = [
            () => {
                if (this.normalPubRho != -1 && this.variables[1].cost > this.normalPubRho - l10(2)) {
                    return this.variables[0].cost <= this.normalPubRho - l10(10 + this.variables[0].level % 8);
                }
                else {
                    let precond = this.normalPubRho == -1 || this.variables[0].cost <= this.normalPubRho - l10(10 + this.variables[0].level % 8);
                    return precond && this.variables[0].level < this.variables[1].level * 4 + (this.milestones[0] ? 2 : 1);
                }
            },
            () => {
                if (this.normalPubRho == -1) {
                    return true;
                }
                return this.variables[1].cost <= this.normalPubRho - l10(2);
            },
            () => this.t_var >= 16,
            () => (this.milestones[2] ? this.variables[3].cost + l10(4 + 0.5 * (this.variables[3].level % 8) + 0.0001) < Math.min(this.variables[4].cost, this.variables[5].cost) : true),
            true,
            true,
        ];
        const semiPassiveStrat = [
            () => {
                if (this.normalPubRho == -1) {
                    return true;
                }
                if (this.maxC1Level == -1) {
                    return this.variables[0].cost <= this.normalPubRho - l10(7.3 + 0.8 * this.variables[0].level % 8);
                }
                return this.variables[0].level < this.maxC1Level;
            },
            () => {
                if (this.normalPubRho == -1) {
                    return true;
                }
                return this.variables[1].cost <= this.normalPubRho - l10(2);
            },
            () => this.t_var >= 16,
            true,
            true,
            true
        ];
        const conditions = {
            RZ: new Array(6).fill(true),
            RZd: activeStrat,
            RZBH: semiPassiveStrat,
            RZdBH: activeStrat,
            RZSpiralswap: activeStrat,
            RZdMS: activeStrat,
            RZMS: semiPassiveStrat,
            // RZnoB: [true, true, false, true, true, false, false],
        };
        return conditions[this.strat].map((v) => (typeof v === "function" ? v : () => v));
    }
    getMilestoneConditions() {
        // "c1", "c2", "b", "w1", "w2", "w3"
        return [
            () => true,
            () => true,
            () => this.variables[2].level < 6,
            () => this.milestones[1] === 1,
            () => this.milestones[2] === 1,
            () => this.milestones[2] === 1,
        ];
    }
    getMilestoneTree() {
        const noBHRoute = [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 1, 0],
            [2, 1, 1, 0],
            [3, 1, 1, 0],
            [3, 1, 1, 0]
        ];
        const BHRoute = [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 1, 0],
            [2, 1, 1, 0],
            [3, 1, 1, 0],
            [3, 1, 1, 0],
            [3, 1, 1, 1]
        ];
        const tree = {
            RZ: noBHRoute,
            RZd: noBHRoute,
            RZBH: BHRoute,
            RZdBH: BHRoute,
            RZSpiralswap: noBHRoute,
            RZdMS: noBHRoute,
            RZMS: noBHRoute,
            // RZnoB: noBHRoute,
        };
        return tree[this.strat];
    }
    getTotMult(val) {
        return Math.max(0, val * 0.2102 + l10(2));
    }
    updateMilestones() {
        const points = [0, 25, 50, 125, 250, 400, 600];
        const stage = binarySearch(points, Math.max(this.lastPub, this.maxRho));
        const max = [3, 1, 1, 1];
        const originPriority = [2, 1, 3];
        const peripheryPriority = [2, 3, 1];
        if (this.strat === "RZSpiralswap" && stage >= 2 && stage <= 4) {
            // Spiralswap
            let priority = originPriority;
            if (this.zTerm > 1)
                priority = peripheryPriority;
            let milestoneCount = stage;
            this.milestones = [0, 0, 0, 0];
            for (let i = 0; i < priority.length; i++) {
                while (this.milestones[priority[i] - 1] < max[priority[i] - 1] && milestoneCount > 0) {
                    this.milestones[priority[i] - 1]++;
                    milestoneCount--;
                }
            }
        }
        else if ((this.strat === "RZMS" || this.strat === "RZdMS") && stage >= 2 && stage <= 4) {
            let priority = peripheryPriority;
            if (this.maxRho > this.lastPub)
                priority = originPriority;
            let milestoneCount = stage;
            this.milestones = [0, 0, 0, 0];
            for (let i = 0; i < priority.length; i++) {
                while (this.milestones[priority[i] - 1] < max[priority[i] - 1] && milestoneCount > 0) {
                    this.milestones[priority[i] - 1]++;
                    milestoneCount--;
                }
            }
        }
        else if ((this.strat === "RZBH" || this.strat === "RZdBH") && stage === 6) {
            // Black hole coasting
            if ((!this.bhAtRecovery && (this.t_var <= this.targetZero)) ||
                (this.bhAtRecovery && (this.maxRho < this.lastPub)))
                this.milestones = this.milestoneTree[Math.min(this.milestoneTree.length - 1, stage)];
            else
                this.milestones = this.milestoneTree[stage + 1];
        }
        else {
            this.milestones = this.milestoneTree[Math.min(this.milestoneTree.length - 1, stage)];
        }
    }
    snapZero() {
        this.bhSearchingRewind = false;
        this.offGrid = true;
        let z;
        let tmpZ;
        let bhdt;
        let dNewt;
        do {
            z = zeta(this.t_var, this.ticks, this.offGrid, lookups.zetaLookup);
            tmpZ = zeta(this.t_var + 1 / 100000, this.ticks, this.offGrid, lookups.zetaDerivLookup);
            dNewt = (tmpZ[2] - z[2]) * 100000;
            bhdt = Math.max(-1, -z[2] / dNewt);
            bhdt = Math.min(bhdt, 0.75);
            this.t_var += bhdt;
        } while (Math.abs(bhdt) >= 1e-9);
        this.bhFoundZero = true;
        z = zeta(this.t_var, this.ticks, this.offGrid, lookups.zetaLookup);
        tmpZ = zeta(this.t_var + 1 / 100000, this.ticks, this.offGrid, lookups.zetaDerivLookup);
        let dr = tmpZ[0] - z[0];
        let di = tmpZ[1] - z[1];
        this.bhdTerm = l10(Math.sqrt(dr * dr + di * di) * 100000);
        this.rCoord = z[0];
        this.iCoord = z[1];
        this.bhzTerm = Math.abs(z[2]);
    }
    constructor(data) {
        super(data);
        this.totMult = this.getTotMult(data.rho);
        this.curMult = 0;
        this.targetZero = 999999999;
        this.currencies = [0, 0];
        this.t_var = 0;
        this.zTerm = 0;
        this.rCoord = -1.4603545088095868;
        this.iCoord = 0;
        this.offGrid = false;
        this.bhSearchingRewind = true;
        this.bhFoundZero = false;
        this.bhAtRecovery = false;
        this.bhzTerm = 0;
        this.bhdTerm = 0;
        this.maxTVar = 0;
        this.normalPubRho = -1;
        this.maxC1Level = -1;
        this.maxC1LevelActual = -1;
        this.varNames = ["c1", "c2", "b", "w1", "w2", "w3" /*, "b+"*/];
        this.variables = [
            new Variable({
                firstFreeCost: true,
                cost: new ExponentialCost(225, Math.pow(2, 0.699)),
                // const c1Cost = new FirstFreeCost(new ExponentialCost(225, 0.699));
                // const getc1 = (level) => Utils.getStepwisePowerSum(level, 2, 8, 0);
                stepwisePowerSum: {
                    base: 2,
                    length: 8,
                },
            }),
            new Variable({
                cost: new ExponentialCost(1500, Math.pow(2, 0.699 * 4)),
                varBase: 2,
            }),
            new Variable({
                cost: new CompositeCost(1, new ConstantCost("1e15"), new CompositeCost(1, new ConstantCost("1e45"), new CompositeCost(1, new ConstantCost("1e360"), new CompositeCost(1, new ConstantCost("1e810"), new CompositeCost(1, new ConstantCost("1e1050"), new ConstantCost("e1200"))))))
                // cost: new ExponentialCost(1e21, 1e79),
                // power: use outside method
            }),
            // const w1Cost = new StepwiseCost(new ExponentialCost(12000, Math.log2(100)/3), 6);
            // const getw1 = (level) => Utils.getStepwisePowerSum(level, 2, 8, 1);
            new Variable({
                cost: new StepwiseCost(6, new ExponentialCost(12000, Math.pow(100, 1 / 3))),
                value: 1,
                stepwisePowerSum: {
                    base: 2,
                    length: 8,
                },
            }),
            // const w2Cost = new ExponentialCost(1e5, Math.log2(10));
            // const getw2 = (level) => BigNumber.TWO.pow(level);
            new Variable({
                cost: new ExponentialCost(1e5, 10),
                varBase: 2,
            }),
            new Variable({
                cost: new ExponentialCost("3.16227766017e600", '1e30'),
                varBase: 2,
            }),
            // new Variable({
            //     cost: new ExponentialCost("1e600", "1e300"),
            //     // b (2nd layer)
            // }),
        ];
        this.pubUnlock = 9;
        this.conditions = this.getBuyingConditions();
        this.milestoneConditions = this.getMilestoneConditions();
        this.milestoneTree = this.getMilestoneTree();
        this.updateMilestones();
        // this.output = document.querySelector(".varOutput");
        // this.outputResults = "time,t,rho,delta<br>";
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            let pubCondition = false;
            while (!pubCondition) {
                if (!global.simulating)
                    break;
                // Prevent lookup table from retrieving values from wrong sim settings
                if (!this.ticks && (this.dt !== lookups.prevDt || this.ddt !== lookups.prevDdt)) {
                    lookups.prevDt = this.dt;
                    lookups.prevDdt = this.ddt;
                    lookups.zetaLookup = [];
                    lookups.zetaDerivLookup = [];
                }
                if ((this.ticks + 1) % 500000 === 0)
                    yield sleep();
                this.tick();
                if (this.currencies[0] > this.maxRho)
                    this.maxRho = this.currencies[0];
                this.updateMilestones();
                this.curMult = Math.pow(10, this.getTotMult(this.maxRho) - this.totMult);
                this.buyVariables();
                pubCondition = (global.forcedPubTime !== Infinity ? this.t > global.forcedPubTime : this.t > this.pubT * 2 || this.pubRho > this.cap[0] || this.curMult > 30) && this.pubRho > this.pubUnlock;
                this.ticks++;
            }
            // Printing
            // this.output.innerHTML = this.outputResults;
            // this.outputResults = '';
            this.pubMulti = Math.pow(10, this.getTotMult(this.pubRho) - this.totMult);
            let stratExtra = "";
            if (this.strat.includes("BH")) {
                stratExtra += ` t=${this.bhAtRecovery ? this.t_var.toFixed(2) : this.targetZero.toFixed(2)}`;
            }
            if (this.normalPubRho != -1) {
                // if(this.maxC1LevelActual == -1)
                stratExtra += ` c1=${this.variables[0].level} c2=${this.variables[1].level}`;
                // else
                //     stratExtra += ` c1=${this.variables[0].level}/${this.maxC1LevelActual} c2=${this.variables[1].level}`
            }
            const result = createResult(this, stratExtra);
            while (this.boughtVars[this.boughtVars.length - 1].timeStamp > this.pubT)
                this.boughtVars.pop();
            global.varBuy.push([result[7], this.boughtVars]);
            return result;
        });
    }
    tick() {
        let t_dot;
        /*
        if (this.bhFoundZero) {
            t_dot = 0;
            // t_dot = getBlackholeSpeed(this.zTerm);
            this.offGrid = true;
        }
        else t_dot = 1 / resolution;
        */
        if (!this.milestones[3]) {
            t_dot = 1 / resolution;
            this.t_var += (this.dt * t_dot) / 1.5;
        }
        const tTerm = l10(this.t_var);
        const bonus = l10(this.dt) + this.totMult;
        const w1Term = this.milestones[1] ? this.variables[3].value : 0;
        const w2Term = this.milestones[2] ? this.variables[4].value : 0;
        const w3Term = this.milestones[2] ? this.variables[5].value : 0;
        const c1Term = this.variables[0].value * c1Exp[this.milestones[0]];
        const c2Term = this.variables[1].value;
        const bTerm = getb(this.variables[2].level);
        if (!this.bhFoundZero) {
            const z = zeta(this.t_var, this.ticks, this.offGrid, lookups.zetaLookup);
            if (this.milestones[1]) {
                const tmpZ = zeta(this.t_var + 1 / 100000, this.ticks, this.offGrid, lookups.zetaDerivLookup);
                const dr = tmpZ[0] - z[0];
                const di = tmpZ[1] - z[1];
                const derivTerm = l10(Math.sqrt(dr * dr + di * di) * 100000);
                // derivCurrency.value += dTerm.pow(bTerm) * w1Term * w2Term * w3Term * bonus;
                this.currencies[1] = add(this.currencies[1], derivTerm * bTerm + w1Term + w2Term + w3Term + bonus);
                if (this.milestones[3]) {
                    let dNewt = (tmpZ[2] - z[2]) * 100000;
                    let bhdt = Math.max(-1, -z[2] / dNewt);
                    bhdt = Math.min(bhdt, 0.75);
                    if (this.bhSearchingRewind && bhdt > 0) {
                        t_dot = 1 / resolution;
                        this.t_var += (this.dt * t_dot) / 1.5;
                    }
                    else {
                        this.snapZero();
                    }
                }
            }
            this.rCoord = z[0];
            this.iCoord = z[1];
            this.zTerm = Math.abs(z[2]);
            this.currencies[0] = add(this.currencies[0], tTerm + c1Term + c2Term + w1Term + bonus - l10(this.zTerm / (Math.pow(2, bTerm)) + 0.01));
        }
        else {
            this.currencies[1] = add(this.currencies[1], this.bhdTerm * bTerm + w1Term + w2Term + w3Term + bonus);
            this.currencies[0] = add(this.currencies[0], tTerm + c1Term + c2Term + w1Term + bonus - l10(this.bhzTerm / (Math.pow(2, bTerm)) + 0.01));
        }
        // normCurrency.value += tTerm * c1Term * c2Term * w1Term * bonus / (zTerm / BigNumber.TWO.pow(bTerm) + bMarginTerm);
        this.t += this.dt / 1.5;
        this.dt *= this.ddt;
        if (this.maxRho < this.recovery.value)
            this.recovery.time = this.t;
        this.tauH = (this.maxRho - this.lastPub) / (this.t / 3600);
        if (this.maxTauH < this.tauH || this.maxRho >= this.cap[0] - this.cap[1] || this.pubRho < this.pubUnlock || global.forcedPubTime !== Infinity) {
            this.maxTauH = this.tauH;
            this.pubT = this.t;
            this.pubRho = this.maxRho;
            this.maxTVar = this.t_var;
        }
        // this.outputResults += `${this.t},${this.t_var},${this.currencies[0]},${this.currencies[1]}<br>`;
    }
    buyVariables() {
        const currencyIndices = [0, 0, 0, 1, 1, 1];
        for (let i = this.variables.length - 1; i >= 0; i--)
            while (true) {
                if (this.currencies[currencyIndices[i]] > this.variables[i].cost && this.conditions[i]() && this.milestoneConditions[i]()) {
                    this.currencies[currencyIndices[i]] = subtract(this.currencies[currencyIndices[i]], this.variables[i].cost);
                    if (this.maxRho + 5 > this.lastPub) {
                        let vb = {
                            variable: this.varNames[i],
                            level: this.variables[i].level + 1,
                            cost: this.variables[i].cost,
                            timeStamp: this.t,
                        };
                        if (currencyIndices[i] == 1) {
                            vb.symbol = "delta";
                        }
                        this.boughtVars.push(vb);
                    }
                    this.variables[i].buy();
                }
                else
                    break;
            }
    }
}
class rzSimWrap extends theoryClass {
    constructor(data) {
        super(data);
        this._originalData = data;
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.strat.includes("BH") && this.lastPub >= 600) {
                let zeroList = this.strat.startsWith("RZd") ? rzdZeros : rzZeros;
                let startZeroIndex = 0;
                let bestSim = new rzSim(this._originalData);
                bestSim.bhAtRecovery = true;
                let bestSimRes = yield bestSim.simulate();
                let boundaryCondition = null;
                if (!this.strat.startsWith("RZd")) {
                    for (let x of goodzeros.rzIdleBHBoundaries) {
                        if (this._originalData.rho <= x.toRho) {
                            boundaryCondition = x;
                            break;
                        }
                    }
                }
                for (let i = startZeroIndex; i < zeroList.length; i++) {
                    let zero = zeroList[i];
                    if (boundaryCondition != null) {
                        if (zero < boundaryCondition.from || zero > boundaryCondition.to) {
                            continue;
                        }
                    }
                    let internalSim = new rzSim(this._originalData);
                    internalSim.targetZero = zero;
                    let res = yield internalSim.simulate();
                    if (bestSim.maxTauH < internalSim.maxTauH) {
                        bestSim = internalSim;
                        bestSimRes = res;
                    }
                    // let internalSim2 = new rzSim(this._originalData)
                    // internalSim2.targetZero = zero;
                    // internalSim2.normalPubRho = internalSim.pubRho;
                    // internalSim2.maxC1LevelActual = internalSim.variables[0].level;
                    // let res2 = await internalSim2.simulate();
                    // if(bestSim.maxTauH < internalSim2.maxTauH) {
                    //     bestSim = internalSim2;
                    //     bestSimRes = res2;
                    // }
                    if (!this.strat.startsWith("RZd")) {
                        // Actual bounds are 14 to 18, saves 23m, but performance is shit.
                        for (let j = 14; j <= 14; j++) {
                            let internalSim3 = new rzSim(this._originalData);
                            internalSim3.targetZero = zero;
                            internalSim3.normalPubRho = internalSim.pubRho;
                            internalSim3.maxC1Level = internalSim.variables[0].level - j;
                            internalSim3.maxC1LevelActual = internalSim.variables[0].level;
                            let res3 = yield internalSim3.simulate();
                            if (bestSim.maxTauH < internalSim3.maxTauH) {
                                bestSim = internalSim3;
                                bestSimRes = res3;
                            }
                        }
                    }
                }
                for (let key in bestSim) {
                    // @ts-ignore
                    if (bestSim.hasOwnProperty(key) && typeof bestSim[key] !== "function") {
                        // @ts-ignore
                        this[key] = bestSim[key];
                    }
                }
                return bestSimRes;
            }
            else {
                let internalSim = new rzSim(this._originalData);
                let ret = yield internalSim.simulate();
                let internalSim2 = new rzSim(this._originalData);
                internalSim2.normalPubRho = internalSim.pubRho;
                let ret2 = internalSim2.simulate();
                let bestSim = internalSim.maxTauH > internalSim2.maxTauH ? internalSim : internalSim2;
                let bestRet = internalSim.maxTauH > internalSim2.maxTauH ? ret : ret2;
                for (let key in bestSim) {
                    // @ts-ignore
                    if (bestSim.hasOwnProperty(key) && typeof bestSim[key] !== "function") {
                        // @ts-ignore
                        this[key] = bestSim[key];
                    }
                }
                return bestRet;
            }
        });
    }
}
