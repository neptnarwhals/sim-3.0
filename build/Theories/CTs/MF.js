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
import { ExponentialValue, StepwisePowerSumValue } from "../../Utils/value";
import Variable from "../../Utils/variable.js";
import { theoryClass } from "../theory.js";
import { ExponentialCost, FirstFreeCost } from '../../Utils/cost.js';
export default function mf(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield ((new mfSimWrap(data)).simulate());
    });
}
const mu0 = 4e-7 * Math.PI;
const q0 = 1.602e-19;
const i0 = 1e-15;
const m0 = 1e-3;
class mfSim extends theoryClass {
    getBuyingConditions() {
        const autobuyall = new Array(9).fill(true);
        const idleStrat = [
            true,
            true,
            true,
            true,
            true,
            ...new Array(4).fill(() => (this.maxRho <= this.lastPub + this.vMaxBuy && this.buyV))
        ];
        const activeStrat = [
            () => {
                if (this.normalPubRho != -1 && Math.min(this.variables[1].cost, this.variables[3].cost, this.variables[4].cost) > this.normalPubRho - l10(2)) {
                    return this.variables[0].cost + l10(10) <= this.normalPubRho;
                }
                else {
                    return this.variables[0].cost + l10(9.9) <= Math.min(this.variables[1].cost, this.variables[3].cost, this.variables[4].cost);
                }
            },
            () => {
                if (this.normalPubRho == -1) {
                    return true;
                }
                return this.variables[1].cost <= this.normalPubRho - l10(2);
            },
            () => {
                if (this.normalPubRho != -1 && Math.min(this.variables[1].cost, this.variables[3].cost, this.variables[4].cost) > this.normalPubRho - l10(2)) {
                    return this.variables[2].cost + l10(10) <= this.normalPubRho;
                }
                else {
                    return this.i / (i0 * Math.pow(10, this.variables[3].value)) < 0.5 || this.variables[2].cost + 1 < this.maxRho;
                }
            },
            () => {
                if (this.normalPubRho == -1) {
                    return true;
                }
                return this.variables[3].cost <= this.normalPubRho - l10(2);
            },
            () => {
                if (this.normalPubRho == -1) {
                    return this.variables[4].cost < Math.min(this.variables[1].cost, this.variables[3].cost);
                }
                return (this.variables[4].cost <= this.normalPubRho - l10(2)) && this.variables[4].cost < Math.min(this.variables[1].cost, this.variables[3].cost);
            },
            ...new Array(4).fill(() => (this.maxRho <= this.lastPub + this.vMaxBuy && this.buyV))
        ];
        const activeStrat2 = [
            () => {
                const dPower = [3.09152, 3.00238, 2.91940];
                return this.variables[0].cost + l10(8 + (this.variables[0].level % 7)) <= Math.min(this.variables[1].cost + l10(2), this.variables[3].cost, this.milestones[1] * (this.variables[4].cost + l10(dPower[this.milestones[2]])));
            },
            () => {
                return true;
            },
            () => {
                return l10(this.i) + l10(1.2) < this.variables[3].value - 15 || (this.variables[2].cost + l10(20) < this.maxRho && l10(this.i) + l10(1.012) < this.variables[3].value - 15);
            },
            () => {
                return true;
            },
            () => {
                const dPower = [3.09152, 3.00238, 2.91940];
                return this.variables[4].cost + l10(dPower[this.milestones[2]]) < Math.min(this.variables[1].cost + l10(2), this.variables[3].cost);
            },
            ...new Array(4).fill(() => (this.maxRho <= this.lastPub + this.vMaxBuy && this.buyV))
        ];
        const tailActiveGen = (i, offset) => {
            return () => {
                if (this.maxRho <= this.lastPub + offset) {
                    if (idleStrat[i] == true) {
                        return true;
                    }
                    return idleStrat[i]();
                }
                else {
                    if (activeStrat[i] == true) {
                        return true;
                    }
                    return activeStrat[i]();
                }
            };
        };
        function makeMFdPostRecovery(offset) {
            let tailActive = [];
            for (let i = 0; i < 9; i++) {
                tailActive.push(tailActiveGen(i, offset));
            }
            return tailActive;
        }
        const conditions = {
            MF: idleStrat,
            MFd: activeStrat,
            MFd2: activeStrat2,
            MFd2SLOW: activeStrat2,
            MFdPostRecovery0: makeMFdPostRecovery(0),
            MFdPostRecovery1: makeMFdPostRecovery(1),
            MFdPostRecovery2: makeMFdPostRecovery(2),
            MFdPostRecovery3: makeMFdPostRecovery(3),
            MFdPostRecovery4: makeMFdPostRecovery(4),
            MFdPostRecovery5: makeMFdPostRecovery(5),
            MFdPostRecovery6: makeMFdPostRecovery(6),
            MFdPostRecovery7: makeMFdPostRecovery(7),
            MFdPostRecovery8: makeMFdPostRecovery(8),
            MFdPostRecovery9: makeMFdPostRecovery(9)
        };
        const condition = conditions[this.strat].map((v) => (typeof v === "function" ? v : () => v));
        return condition;
    }
    getMilestoneConditions() {
        const conditions = [
            () => true,
            () => true,
            () => true,
            () => true,
            () => this.milestones[1] > 0,
            () => true,
            () => true,
            () => this.milestones[0] > 0,
            () => this.milestones[0] > 0
        ];
        return conditions;
    }
    getMilestoneTree() {
        const globalOptimalRoute = [
            [0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0],
            [1, 1, 2, 0, 0, 0],
            [1, 1, 2, 1, 0, 0],
            [1, 1, 2, 2, 0, 0],
            [1, 1, 2, 2, 1, 0],
            [1, 1, 2, 2, 2, 0],
            [1, 1, 2, 2, 2, 1]
        ];
        const tree = {
            MF: globalOptimalRoute,
            MFd: globalOptimalRoute,
            MFd2: globalOptimalRoute,
            MFd2SLOW: globalOptimalRoute,
            MFdPostRecovery0: globalOptimalRoute,
            MFdPostRecovery1: globalOptimalRoute,
            MFdPostRecovery2: globalOptimalRoute,
            MFdPostRecovery3: globalOptimalRoute,
            MFdPostRecovery4: globalOptimalRoute,
            MFdPostRecovery5: globalOptimalRoute,
            MFdPostRecovery6: globalOptimalRoute,
            MFdPostRecovery7: globalOptimalRoute,
            MFdPostRecovery8: globalOptimalRoute,
            MFdPostRecovery9: globalOptimalRoute,
        };
        return tree[this.strat];
    }
    getTotMult(val) {
        return Math.max(0, val * this.tauFactor * 0.17);
    }
    updateMilestones() {
        const points = [0, 20, 50, 175, 225, 275, 325, 425, 475, 525];
        const stage = binarySearch(points, Math.max(this.lastPub, this.maxRho));
        this.milestones = this.milestoneTree[Math.min(this.milestoneTree.length - 1, stage)];
        this.updateC();
    }
    omegaexp() {
        return 4.1 + 0.15 * this.milestones[2];
    }
    xexp() {
        return 3.2 + 0.1 * this.milestones[3];
    }
    vexp() {
        return 1.3 + 0.31 * this.milestones[4];
    }
    a1exp() {
        return 1 + 0.01 * this.milestones[5];
    }
    resetParticle() {
        this.x = 0;
        this.vx = Math.pow(10, (this.variables[5].value + this.variables[6].value - 20));
        this.vz = Math.pow(10, (this.variables[7].value + this.variables[8].value - 18));
        this.vtot = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
        this.resets++;
        this.stratExtra = "";
        if (this.resets > 1) {
            this.boughtVars.push({
                variable: 'Reset at V=' + this.variables[5].level + "," + this.variables[6].level + "," + this.variables[7].level + "," + this.variables[8].level,
                level: this.resets - 1,
                cost: this.maxRho,
                timeStamp: this.t
            });
            // console.log(this.strat + " vMaxBuy="+this.vMaxBuy+": "+(this.resets) + " resets ("+ parseFloat((this.t/3600).toFixed(2)).toFixed(2)+" hours & "+(10**(this.maxRho % 1)).toFixed(2)+'e'+Math.floor(this.maxRho) + " rho), "+"resetMulti= "+this.dynamicResetMulti+", v1="+this.variables[5].level+", v2="+this.variables[6].level+", v3="+this.variables[7].level+", v4="+this.variables[8].level)
            const currentIndex = this.resetCombination.indexOf(this.dynamicResetCombination);
            if (currentIndex + 1 < this.resetCombination.length) {
                this.dynamicResetCombination = this.resetCombination[currentIndex + 1];
            }
            else {
                this.dynamicResetCombination = this.resetCombination[0];
            }
            this.dynamicResetLevels = this.getMaxVBuy();
            this.lastResetLevels = [this.variables[5].level, this.variables[6].level, this.variables[7].level, this.variables[8].level];
            this.nextResetLevels = [];
            for (let i = 0; i < this.lastResetLevels.length; i++) {
                this.nextResetLevels.push(this.lastResetLevels[i] + this.dynamicResetLevels[i]);
            }
        }
        this.buyV = false;
    }
    updateC() {
        const xterm = l10(4e13) * this.xexp();
        const omegaterm = (l10(m0 / (q0 * mu0 * i0)) - l10(900)) * this.omegaexp();
        const vterm = this.milestones[0] ? l10(3e19) * 1.3 + l10(1e5) * (this.vexp() - 1.3) : 0;
        this.c = xterm + omegaterm + vterm + l10(8.67e23);
    }
    constructor(data, resetCombination, vMaxBuy, overage) {
        super(data);
        this.pubUnlock = 8;
        this.totMult = data.rho < this.pubUnlock ? 0 : this.getTotMult(data.rho);
        this.rho = 0;
        this.c = 0;
        this.x = 0;
        this.i = 0;
        this.vx = 0;
        this.vz = 0;
        this.vtot = 0;
        this.resets = 0;
        this.varNames = ["c1", "c2", "a1", "a2", "δ", "v1", "v2", "v3", "v4"];
        this.normalPubRho = -1;
        this.resetCombination = resetCombination;
        this.dynamicResetCombination = resetCombination[0];
        this.vMaxBuy = vMaxBuy;
        this.overage = overage;
        this.dynamicResetLevels = [2, 1, 0, 0];
        this.lastResetLevels = [0, 0, 0, 0];
        this.nextResetLevels = [2, 1, 0, 0];
        this.nextResetCost = l10(16480);
        this.buyV = false;
        this.stratExtra = "";
        this.resetCond = false;
        this.variables =
            [
                new Variable({ cost: new FirstFreeCost(new ExponentialCost(10, 2)), valueScaling: new StepwisePowerSumValue(2, 7) }),
                new Variable({ cost: new ExponentialCost(1e3, 50), valueScaling: new ExponentialValue(2) }),
                new Variable({ cost: new ExponentialCost(1e3, 25), valueScaling: new StepwisePowerSumValue(2, 5), value: l10(3) }),
                new Variable({ cost: new ExponentialCost(1e4, 100), valueScaling: new ExponentialValue(1.25) }),
                new Variable({ cost: new ExponentialCost(1e50, 300), valueScaling: new ExponentialValue(1.1) }),
                new Variable({ cost: new ExponentialCost(80, 80), valueScaling: new StepwisePowerSumValue(), value: 0 }),
                new Variable({ cost: new ExponentialCost(1e4, Math.pow(10, 4.5)), valueScaling: new ExponentialValue(1.3) }),
                new Variable({ cost: new ExponentialCost(1e50, 70), valueScaling: new StepwisePowerSumValue() }),
                new Variable({ cost: new ExponentialCost(1e52, 1e6), valueScaling: new ExponentialValue(1.5) }), // v4
            ];
        this.conditions = this.getBuyingConditions();
        this.milestoneConditions = this.getMilestoneConditions();
        this.milestoneTree = this.getMilestoneTree();
        this.updateMilestones();
        this.resetParticle();
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            let pubCondition = false;
            while (!pubCondition) {
                if (!global.simulating)
                    break;
                if ((this.ticks + 1) % 500000 === 0)
                    yield sleep();
                this.tick();
                if (this.rho > this.maxRho)
                    this.maxRho = this.rho;
                this.updateMilestones();
                this.curMult = Math.pow(10, (this.getTotMult(this.maxRho) - this.totMult));
                this.buyVariables();
                pubCondition = (global.forcedPubTime !== Infinity ? this.t > global.forcedPubTime : this.t > this.pubT * 2 || this.pubRho > this.cap[0] || this.pubMulti > 3.5) && this.pubRho > this.pubUnlock;
                this.ticks++;
            }
            this.pubMulti = Math.pow(10, (this.getTotMult(this.pubRho) - this.totMult));
            const result = createResult(this, " Resets: " + this.resetCombination + " Overage: " + this.overage);
            while (this.boughtVars[this.boughtVars.length - 1].timeStamp > this.pubT)
                this.boughtVars.pop();
            global.varBuy.push([result[7], this.boughtVars]);
            return result;
        });
    }
    tick() {
        const newdt = this.dt * 1;
        const va1 = Math.pow(10, (this.variables[2].value * this.a1exp()));
        const va2 = Math.pow(10, this.variables[3].value);
        const vc1 = this.variables[0].value;
        const vc2 = this.variables[1].value;
        this.x += newdt * this.vx;
        let icap = va2 * i0;
        let scale = 1 - Math.pow(Math.E, (-newdt * va1 / (400 * va2)));
        if (scale < 1e-13)
            scale = newdt * va1 / (400 * va2);
        this.i = this.i + scale * (icap - this.i);
        this.i = Math.min(this.i, icap);
        const xterm = l10(this.x) * this.xexp();
        const omegaterm = (l10((q0 / m0) * mu0 * this.i) + this.variables[4].value) * this.omegaexp();
        const vterm = this.milestones[0] ? l10(this.vtot) * this.vexp() : 0;
        const rhodot = this.totMult + this.c + vc1 + vc2 + xterm + omegaterm + vterm;
        this.rho = add(this.rho, rhodot + l10(this.dt));
        this.resetCond = ((this.nextResetLevels[0] <= this.variables[5].level) && (this.nextResetLevels[1] <= this.variables[6].level) && (this.nextResetLevels[2] <= this.variables[7].level) && (this.nextResetLevels[3] <= this.variables[8].level));
        if (this.resetCond && this.buyV) {
            this.resetParticle();
        }
        this.t += this.dt / 1.5;
        this.dt *= this.ddt;
        if (this.maxRho < this.recovery.value)
            this.recovery.time = this.t;
        this.tauH = (this.maxRho - this.lastPub) / (this.t / 3600);
        if (this.maxTauH < this.tauH || this.maxRho >= this.cap[0] - this.cap[1] || this.pubRho < this.pubUnlock || global.forcedPubTime !== Infinity) {
            this.maxTauH = this.tauH;
            this.pubT = this.t;
            this.pubRho = this.maxRho;
        }
    }
    buyVariables() {
        for (let i = this.variables.length - 1; i >= 0; i--) {
            while (true) {
                if ((!this.buyV) && (i >= 5 && (this.rho > this.nextResetCost))) {
                    this.buyV = true;
                }
                if (this.rho > this.variables[i].cost && this.conditions[i]() && this.milestoneConditions[i]()) {
                    // debug: REPLACE TRUE WITH "this.maxRho + 10 > this.lastPub"
                    if (true) {
                        this.boughtVars.push({
                            variable: this.varNames[i],
                            level: this.variables[i].level + 1,
                            cost: this.variables[i].cost,
                            timeStamp: this.t
                        });
                    }
                    this.rho = subtract(this.rho, this.variables[i].cost);
                    this.variables[i].buy();
                }
                else {
                    break;
                }
            }
        }
    }
    getMaxVBuy() {
        let v2ToBuy = this.dynamicResetCombination[0];
        let v4ToBuy = this.dynamicResetCombination[1];
        let v1Cur = this.variables[5].level;
        let v2Cur = this.variables[6].level;
        let v3Cur = this.variables[7].level;
        let v4Cur = this.variables[8].level;
        const v2MaxCost = v2ToBuy !== 0 ? (4 + 4.5 * (v2Cur + v2ToBuy - 1)) : 0;
        if (v2MaxCost + this.overage < 52) {
            v4ToBuy = 0;
        }
        const v4MaxCost = v4ToBuy !== 0 ? (52 + 6 * (v4Cur + v4ToBuy - 1)) : 0;
        const maxSpend = add(Math.max(v2MaxCost, v4MaxCost), this.overage);
        let v1ToBuy = 0;
        while ((l10(80) + l10(80) * (v1Cur + v1ToBuy)) <= maxSpend) {
            v1ToBuy++;
        }
        let v3ToBuy = 0;
        while (((50 + l10(70) * (v3Cur + v3ToBuy)) <= maxSpend) && (maxSpend >= 52)) {
            v3ToBuy++;
        }
        const varLevels = [v1ToBuy, v2ToBuy, v3ToBuy, v4ToBuy];
        return varLevels;
    }
    getTotalVCost() {
        const costsBase = [l10(80), 4, 50, 52];
        const costsInc = [l10(80), 4.5, l10(70), 6];
        let totalCost = 0;
        for (let i = 0; i < 4; i++) {
            let buyLevel = this.dynamicResetLevels[i];
            if (buyLevel >= 0) {
                let index = i + 5;
                let vLevel = this.variables[index].level;
                let totalVarCost = 0;
                for (let j = 0; j < buyLevel; j++) {
                    const varCost = costsBase[i] + costsInc[i] * (vLevel + j);
                    totalVarCost = add(totalVarCost, varCost);
                }
                totalCost = add(totalCost, totalVarCost);
            }
        }
        return totalCost;
    }
}
class mfSimWrap extends theoryClass {
    constructor(data) {
        super(data);
        this._originalData = data;
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            let overages = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3];
            const resetVarValues = [[1, 0], [1, 1], [2, 1], [2, 2]];
            //const resetCombos: number[][][] = [
            //  [[1, 0], [1, 1]], [[1, 0], [2, 1]], [[1, 0], [2, 2]], 
            //  [[1, 1]], [[1, 1], [2, 1]], [[1, 1], [2, 2]], 
            //  [[2, 1]], [[2, 1], [2, 2]], 
            //  [[2, 2]]
            //] 
            const vMaxBuys = Array.from({ length: 15 }, (_, index) => index);
            let finalSim;
            let finalSimRes;
            for (const vMaxBuy of vMaxBuys) {
                for (const resetCombination of getAllCombinations(resetVarValues, true)) {
                    for (let i = 0; i < overages.length; i++) {
                        const overage = overages[i];
                        let bestSim = new mfSim(this._originalData, resetCombination, vMaxBuy, overage);
                        let bestSimRes = yield bestSim.simulate();
                        // Unnecessary additional coasting attempt
                        // let internalSim = new mfSim(this._originalData, resetCombination)
                        // internalSim.normalPubRho = bestSim.pubRho;
                        // let res = await internalSim.simulate();
                        // if (bestSim.maxTauH < internalSim.maxTauH) {
                        //   bestSim = internalSim;
                        //   bestSimRes = res;
                        // }
                        if (typeof finalSim !== 'undefined') {
                            if (finalSim.maxTauH < bestSim.maxTauH) {
                                finalSim = bestSim;
                                finalSimRes = bestSimRes;
                            }
                        }
                        else {
                            finalSim = bestSim;
                            finalSimRes = bestSimRes;
                        }
                    }
                }
            }
            for (let key in finalSim) {
                // @ts-ignore
                if (finalSim.hasOwnProperty(key) && typeof finalSim[key] !== "function") {
                    // @ts-ignore
                    this[key] = finalSim[key];
                }
            }
            return finalSimRes;
        });
    }
}
function getAllCombinations(values, slowMode) {
    const combinations = [];
    for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values.length; j++) {
            if (slowMode) {
                for (let k = 0; k < values.length; k++) {
                    combinations.push([values[i], values[j], values[k]]);
                }
            }
            else {
                combinations.push([values[i], values[j]]);
            }
        }
    }
    return combinations;
}
