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
import { add, createResult, l10, subtract, sleep } from "../../Utils/helpers.js";
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
        const conditions = {
            MF: idleStrat,
            MFd: activeStrat
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
            [1, 1, 0, 1, 0, 0],
            [1, 1, 0, 2, 0, 0],
            [1, 1, 1, 2, 0, 0],
            [1, 1, 2, 2, 0, 0],
            [1, 1, 2, 2, 1, 0],
            [1, 1, 2, 2, 2, 0],
            [1, 1, 2, 2, 2, 1]
        ];
        const tree = {
            MF: globalOptimalRoute,
            MFd: globalOptimalRoute
        };
        return tree[this.strat];
    }
    getTotMult(val) {
        return Math.max(0, val * this.tauFactor * 0.17);
    }
    updateMilestones() {
        let stage = 0;
        const points = [20, 50, 175, 225, 275, 325, 425, 475, 525];
        for (let i = 0; i < points.length; i++) {
            if (Math.max(this.lastPub, this.maxRho) >= points[i])
                stage = i + 1;
        }
        this.milestones = this.milestoneTree[Math.min(this.milestoneTree.length - 1, stage)];
        this.updateC();
    }
    xexp() {
        if (this.official) {
            return 3.2 + 0.1 * this.milestones[2];
        }
        else {
            return 3.2 + 0.24 * this.milestones[2];
        }
    }
    omegaexp() {
        if (this.official) {
            return 4.1 + 0.15 * this.milestones[3];
        }
        else {
            return 4.1 + 0.22 * this.milestones[3];
        }
    }
    vexp() {
        if (this.official) {
            return 1.3 + 0.31 * this.milestones[4];
        }
        else {
            return 1.3 + 0.39 * this.milestones[4];
        }
    }
    a1exp() {
        return 1 + 0.01 * this.milestones[5];
    }
    resetParticle() {
        this.x = 0;
        this.vx = Math.pow(10, (this.variables[5].value + this.variables[6].value - 20));
        this.vz = Math.pow(10, (this.variables[7].value + this.variables[8].value - 18));
        if (this.official) {
            this.vtot = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
        }
        else {
            this.vtot = Math.sqrt(this.vx * this.vx + 2 * this.vz * this.vz);
        }
        this.resets++;
        this.stratExtra = "";
        if (this.resets > 1) {
            this.boughtVars.push({
                variable: 'Reset at V=' + this.variables[5].level + "," + this.variables[6].level + "," + this.variables[7].level + "," + this.variables[8].level,
                level: this.resets - 1,
                cost: this.maxRho,
                timeStamp: this.t
            });
        }
        // console.log(this.strat + " vMaxBuy="+this.vMaxBuy+": "+(this.resets) + " resets ("+ parseFloat((this.t/3600).toFixed(2)).toFixed(2)+" hours & "+(10**(this.maxRho % 1)).toFixed(2)+'e'+Math.floor(this.maxRho) + " rho), "+"resetMulti= "+this.dynamicResetMulti+", v1="+this.variables[5].level+", v2="+this.variables[6].level+", v3="+this.variables[7].level+", v4="+this.variables[8].level)
        const currentIndex = this.resetCombination.indexOf(this.dynamicResetMulti);
        if (currentIndex + 1 < this.resetCombination.length) {
            this.dynamicResetMulti = this.resetCombination[currentIndex + 1];
        }
        else {
            this.dynamicResetMulti = this.resetCombination[0];
        }
        if (this.rho > 65) {
            this.buyV = false;
        }
    }
    updateC() {
        const xterm = this.official ? l10(4e13) * this.xexp() : l10(1e15) * this.xexp();
        const omegaterm = this.official ? (l10(m0 / (q0 * mu0 * i0)) - l10(900)) * this.omegaexp() : (l10(m0 / (q0 * mu0 * i0)) - l10(1000)) * this.omegaexp();
        const vterm = this.official ? this.milestones[0] ? l10(3e19) * 1.3 + l10(1e5) * (this.vexp() - 1.3) : 0 : this.milestones[0] ? l10(3e19) * 1.3 + l10(1e6) * (this.vexp() - 1.3) : 0;
        this.c = this.official ? xterm + omegaterm + vterm + l10(8.67e23) : xterm + omegaterm + vterm + l10(4.49e19);
    }
    constructor(data, resetCombination, vMaxBuy, official) {
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
        this.stratExtra = "";
        this.normalPubRho = -1;
        this.resetCombination = resetCombination;
        this.vMaxBuy = vMaxBuy;
        this.dynamicResetMulti = resetCombination[0];
        this.buyV = true;
        this.resetcond = false;
        this.official = official;
        this.variables = official ?
            [
                new Variable({ cost: new FirstFreeCost(new ExponentialCost(10, 2)), stepwisePowerSum: { base: 2, length: 7 } }),
                new Variable({ cost: new ExponentialCost(1e3, 50), varBase: 2 }),
                new Variable({ cost: new ExponentialCost(1e3, 25), stepwisePowerSum: { base: 2, length: 5 }, value: l10(3) }),
                new Variable({ cost: new ExponentialCost(1e4, 100), varBase: 1.25 }),
                new Variable({ cost: new ExponentialCost(1e50, 300), varBase: 1.1 }),
                new Variable({ cost: new ExponentialCost(80, 80), stepwisePowerSum: { default: true }, value: 0 }),
                new Variable({ cost: new ExponentialCost(1e4, Math.pow(10, 4.5)), varBase: 1.3 }),
                new Variable({ cost: new ExponentialCost(1e50, 70), stepwisePowerSum: { default: true } }),
                new Variable({ cost: new ExponentialCost(1e52, 1e6), varBase: 1.5 }), // v4
            ] :
            [
                new Variable({ cost: new FirstFreeCost(new ExponentialCost(10, 2)), stepwisePowerSum: { base: 2, length: 7 } }),
                new Variable({ cost: new ExponentialCost(1e3, 100), varBase: 2 }),
                new Variable({ cost: new ExponentialCost(1e3, 25), stepwisePowerSum: { base: 2, length: 5 }, value: 1 }),
                new Variable({ cost: new ExponentialCost(1e4, 55), varBase: 1.25 }),
                new Variable({ cost: new ExponentialCost(1e50, 300), varBase: 1.1 }),
                new Variable({ cost: new ExponentialCost(80, 80), stepwisePowerSum: { default: true }, value: 1 }),
                new Variable({ cost: new ExponentialCost(1e4, Math.pow(10, 4.5)), varBase: 1.3 }),
                new Variable({ cost: new ExponentialCost(1e50, 70), stepwisePowerSum: { default: true } }),
                new Variable({ cost: new ExponentialCost(1e55, 1e6), varBase: 1.5 }), // v4
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
            const result = createResult(this, this.stratExtra);
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
        if (this.official) {
            let scale = 1 - Math.pow(Math.E, (-newdt * va1 / (400 * va2)));
            if (scale < 1e-13)
                scale = newdt * va1 / 400 / va2;
            this.i = this.i + scale * (icap - this.i);
        }
        else {
            this.i = icap - (icap - this.i) * (Math.pow(Math.E, (-this.dt * va1 / 10 / va2)));
        }
        this.i = Math.min(this.i, icap);
        const xterm = l10(this.x) * this.xexp();
        const omegaterm = (l10((q0 / m0) * mu0 * this.i) + this.variables[4].value) * this.omegaexp();
        const vterm = this.milestones[0] ? l10(this.vtot) * this.vexp() : 0;
        const rhodot = this.totMult + this.c + vc1 + vc2 + xterm + omegaterm + vterm;
        this.rho = add(this.rho, rhodot + l10(this.dt));
        const vvx = Math.pow(10, (this.variables[5].value + this.variables[6].value - 20));
        this.resetcond = vvx / this.vx > this.dynamicResetMulti;
        if (this.resetcond && this.buyV) {
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
                if ((!this.buyV) && (i >= 5 && (this.rho > (Math.max(this.variables[5].cost, this.variables[6].cost, this.variables[7].cost, this.variables[8].cost) + l10(2))))) {
                    this.buyV = true;
                }
                if (this.rho > this.variables[i].cost && this.conditions[i]() && this.milestoneConditions[i]()) {
                    if (this.maxRho + 10 > this.lastPub) {
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
}
class mfSimWrap extends theoryClass {
    constructor(data) {
        super(data);
        this._originalData = data;
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            let official = true;
            let resetMultiValues = [];
            for (let i = 1.3; i <= 2.6; i += 0.1) {
                resetMultiValues.push(parseFloat(i.toFixed(1)));
            }
            const vMaxBuys = Array.from({ length: 21 }, (_, index) => index);
            let finalSim;
            let finalSimRes;
            for (const vMaxBuy of vMaxBuys) {
                for (const resetMulti of resetMultiValues) {
                    for (const resetCombination of getAllCombinations(resetMulti)) {
                        let bestSim = new mfSim(this._originalData, resetCombination, vMaxBuy, official); // last variable is for switching on/off official version
                        let bestSimRes = yield bestSim.simulate();
                        // Unnecessary additional cosating attempt
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
function getAllCombinations(resetMulti) {
    // Disabled reset combinations
    // const values = [resetMulti, resetMulti + 0.3, resetMulti - 0.3].filter(val => val >= 1);
    const values = [resetMulti].filter(val => val >= 1);
    const combinations = [];
    function combine(prefix, array) {
        if (prefix.length > 0) {
            combinations.push([...prefix]);
        }
        for (let i = 0; i < array.length; i++) {
            combine([...prefix, array[i]], array.slice(i + 1));
        }
    }
    combine([resetMulti], values.slice(1));
    return combinations;
}
