import { Kind, Nat, Fan } from "../src/types"

import * as p from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

export type ExportType =
    | bigint
    | ExportType[]
    | Fan

export function parse(e:ExportType) : Fan {
    let f : Fan;
    if (typeof e === 'bigint') {
        f = N(e);
    } else if (Array.isArray(e)) {
        f = arrayToExport(e);
    } else {
        f = e as Fan;
    }
    return f;
}

export function arrayToExport(e:ExportType[]) : Fan {
    if (e.length == 0) {
        throw "Impossible empty array in arrayToExport"
    } else if (e.length == 1) {
        return parse(e[0]);
    } else {
        return A(arrayToExport(e.slice(0, -1)), parse(e.slice(-1)));
    }
}

function run(debug:string, e:ExportType) {
    console.log("run(" + debug + ")");
    return F(parse(e));
}

function runpin(debug:string, e:ExportType) {
    console.log("runpin(" + debug + ")");
    let raw = p.mkApp(N(2n), F(parse(e)));
    let arity = p.rawArity(raw);

    // A pin simply calls its arguments. For f(a, b, c), it calls an inner
    // values with (a, b, c). Therefore we have to build that here.
    for (let i = 1n; i <= arity; ++i) {
        raw = arrayToExport([0n, raw, N(i)]);
    }

    // Are these in the right order now?
    let final = F(arrayToExport([0n, 0n, N(arity), raw]));
    console.log("arity: ", arity, "raw: ", raw, "final: ", final);

    return final
}

let s : any = {}
s.mkFun = run("mkFun", 0n);
s.valCase = run("valCase", 1n);
s.natCase = run("natCase", 2n);
s.inc = run("inc", 3n);
s.force = runpin("force", [0n, 435460140902n, 1n, [0n, [2n, [0n, 0n, 0n]], [0n, 2n, 1n]]]);
s.seq = runpin("seq", [0n, 7431539n, 2n, [0n, [0n, [0n, [2n, 2n], 2n], [0n, [0n, 0n, 2n, 1n], 2n]], 1n]]);
s.deepseq = runpin("deepseq", [0n, 31918218849641828n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.seq], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.force], 1n]], 1n]], 2n]]);
s.trk = runpin("trk", [0n, 7041652n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.deepseq], 1n], 2n]], 1n], 2n]]);
s.die = runpin("die", [0n, 6646116n, 1n, [0n, 0n, 1n]]);
s.isFun = runpin("isFun", [0n, 474413953897n, 1n, [0n, [1n, [0n, 0n, 3n, [2n, 1n]], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
s.isApp = runpin("isApp", [0n, 482919674729n, 1n, [0n, [1n, [0n, 0n, 3n, [2n, 0n]], [0n, 0n, 2n, [2n, 1n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
s.isNat = runpin("isNat", [0n, 499848737641n, 1n, [0n, [1n, [0n, 0n, 3n, [2n, 0n]], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 1n]]], 1n]]);
s.car = runpin("car", [0n, 7496035n, 1n, [0n, [1n, [0n, 0n, 3n, [0n, [0n, [2n, 0n], 1n], 2n]], [0n, 0n, 2n, 1n], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
s.cdr = runpin("cdr", [0n, 7496803n, 1n, [0n, [1n, [0n, 0n, 3n, 3n], [0n, 0n, 2n, 2n], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
s.funName = runpin("funName", [0n, 28549237342893414n, 1n, [0n, [1n, [0n, 0n, 3n, 1n], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
s.funArgs = runpin("funArgs", [0n, 32483362743416166n, 1n, [0n, [1n, [0n, 0n, 3n, 2n], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
s.funBody = run("funBody", [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]]);
s.c2 = run("c2", [0n, 0n, 3n, 0n]);
s.trkVal = runpin("trkVal", [0n, 119165317509748n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.trk], 1n], 2n]], [0n, [0n, [0n, 0n, 3n, 0n], 2n], 1n]], 2n]]);
s.caar = runpin("caar", [0n, 1918984547n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]]);
s.cadr = runpin("cadr", [0n, 1919181155n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]);
s.cdar = runpin("cdar", [0n, 1918985315n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]]);
s.cddr = runpin("cddr", [0n, 1919181923n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]);
s.caaar = runpin("caaar", [0n, 491260043619n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]]]);
s.caadr = runpin("caadr", [0n, 491310375267n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.cadar = runpin("cadar", [0n, 491260240227n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]]]);
s.caddr = runpin("caddr", [0n, 491310571875n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.cdaar = runpin("cdaar", [0n, 491260044387n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]]]);
s.cdadr = runpin("cdadr", [0n, 491310376035n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.cddar = runpin("cddar", [0n, 491260240995n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]]]);
s.cdddr = runpin("cdddr", [0n, 491310572643n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.S = runpin("S", [0n, 83n, 3n, [0n, [0n, 1n, 3n], [0n, 2n, 3n]]]);
s.K = runpin("K", [0n, 75n, 2n, 1n]);
s.I = runpin("I", [0n, 73n, 1n, 1n]);
s.B = runpin("B", [0n, 66n, 3n, [0n, 1n, [0n, 2n, 3n]]]);
s.apply = runpin("apply", [0n, 521510350945n, 2n, [0n, 1n, 2n]]);
s.supply = runpin("supply", [0n, 133506649847155n, 2n, [0n, 2n, 1n]]);
s.compose = run("compose", [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.B], 1n], 2n], 3n]]);
s.__true = run("__true", 1n);
s.__false = run("__false", 0n);
s.__if = runpin("__if", [0n, 26217n, 3n, [0n, [0n, [0n, [2n, 2n], 3n], [0n, [0n, 0n, 2n, 1n], 2n]], 1n]]);
s.not = runpin("not", [0n, 7630702n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], 1n], [2n, 0n]], [2n, 1n]]]);
s.bit = runpin("bit", [0n, 7629154n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], 1n], [2n, 1n]], [2n, 0n]]]);
s.and = runpin("and", [0n, 6581857n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.bit], 1n]], 2n]], [2n, 0n]]]);
s.or = runpin("or", [0n, 29295n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], 1n], [2n, 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.bit], 1n]], 2n]]]);
s.xor = runpin("xor", [0n, 7499640n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.bit], 1n]], 2n]]]);
s.nand = runpin("nand", [0n, 1684955502n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], 1n], 2n]]]);
s.nor = runpin("nor", [0n, 7499630n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.or], 1n], 2n]], 1n], 2n]]]);
s.xnor = runpin("xnor", [0n, 1919905400n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.xor], 1n], 2n]], 1n], 2n]]]);
s.ifNot = runpin("ifNot", [0n, 500083615337n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], 1n]], 2n], 3n]]);
s.toNat = runpin("toNat", [0n, 499848736628n, 1n, [0n, [2n, 0n, 3n], 1n]]);
s.inc = run("inc", 3n);
s.dec = runpin("dec", [0n, 6514020n, 1n, [0n, [2n, 0n, [0n, 0n, 1n, 1n]], 1n]]);
s.exec = runpin("exec", [0n, 1667594341n, 3n, [0n, [0n, [0n, [2n, 2n], 2n], [0n, [0n, 0n, 1n], [0n, 1n, 2n]]], 3n]]);
s.add = runpin("add", [0n, 6579297n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.exec], 1n], 2n], 3n]], 3n], [0n, [0n, 0n, 1n, [0n, [2n, s.toNat], 1n]], 1n]], 2n]]);
s.mul = runpin("mul", [0n, 7107949n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.exec], 1n], 2n], 3n]], [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 1n]], [2n, 0n]], 2n]]);
s.sub = runpin("sub", [0n, 6452595n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.exec], 1n], 2n], 3n]], [0n, 0n, 1n, [0n, [2n, s.dec], 1n]]], 1n], 2n]]);
s.lte = runpin("lte", [0n, 6648940n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], 1n], 2n]]]);
s.lth = runpin("lth", [0n, 6845548n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lte], 1n], 2n]], [0n, 3n, 1n]], 2n]]);
s.gte = runpin("gte", [0n, 6648935n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lte], 1n], 2n]], 2n], 1n]]);
s.gth = runpin("gth", [0n, 6845543n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lth], 1n], 2n]], 2n], 1n]]);
s.aeq = runpin("aeq", [0n, 7431521n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lte], 1n], 2n]], 2n], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lte], 1n], 2n]], 1n], 2n]]]);
s.min = runpin("min", [0n, 7235949n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lte], 1n], 2n]], 1n], 2n]], 1n], 2n]]);
s.max = runpin("max", [0n, 7889261n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gth], 1n], 2n]], 1n], 2n]], 1n], 2n]]);
s.div = runpin("div", [0n, 7760228n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lth], 1n], 2n]], 1n], 2n]], [2n, 0n]], [0n, 3n, [0n, [0n, 0n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], 1n], 2n]], 2n]]]]);
s.mod = runpin("mod", [0n, 6582125n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mul], 1n], 2n]], 2n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.div], 1n], 2n]], 1n], 2n]]]]);
s.bex = runpin("bex", [0n, 7890274n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.exec], 1n], 2n], 3n]], [[0n, 0n, 2n, [0n, [0n, [2n, s.mul], 1n], 2n]], 2n], 1n], 1n]]);
s.lsh = runpin("lsh", [0n, 6845292n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mul], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.bex], 1n]], 2n]], 1n]]);
s.rsh = runpin("rsh", [0n, 6845298n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.div], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.bex], 1n]], 2n]]]);
s.even = runpin("even", [0n, 1852143205n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mod], 1n], 2n]], 1n], 2n]]]);
s.odd = runpin("odd", [0n, 6579311n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mod], 1n], 2n]], 1n], 2n]]);

// Why stop at =met? Because the exporter gets confused here on the internal go
// named lambda. TODO: Figure that out.
/*
s.met = runpin("met", [0n, 7628141n, 1n, [0n, [s.go, 0n], 1n]]);
s.roundUp = runpin("roundUp", [0n, 31619087229874034n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.ifNot], 1n], 2n], 3n]], 2n], 1n], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.ifNot], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mod], 1n], 2n]], 1n], 2n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mod], 1n], 2n]], 1n], 2n]]]]]);
s.takeBits = runpin("takeBits", [0n, 8319390145550442868n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.mod], 1n], 2n]], 2n], [0n, [0n, 0n, 1n, [0n, [2n, s.bex], 1n]], 1n]]]);
s.bitWeld = runpin("bitWeld", [0n, 28266680185809250n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lsh], 1n], 2n]], 2n], [0n, [0n, 0n, 1n, [0n, [2n, s.met], 1n]], 1n]]]]);
s.perbit = runpin("perbit", [0n, 127995972052336n, 3n, [0n, [0n, [0n, [0n, [0n, s.go, 1n], 2n], 3n], [2n, 0n]], [2n, 0n]]]);
s.con = runpin("con", [0n, 7237475n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.perbit], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.or], 1n], 2n]]], 1n], 2n]]);
s.dis = runpin("dis", [0n, 7563620n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.perbit], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]]], 1n], 2n]]);
s.mix = runpin("mix", [0n, 7891309n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.perbit], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.xor], 1n], 2n]]], 1n], 2n]]);
s.eql = runpin("eql", [0n, 7106917n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isFun], 1n]], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isFun], 1n]], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.aeq], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.funArgs], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.funArgs], 1n]], 2n]]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.aeq], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.funName], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.funName], 1n]], 2n]]], [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]]]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 2n]]], [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.aeq], 1n], 2n]], 1n], 2n]]]]]);
s.neq = runpin("neq", [0n, 7431534n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 1n], 2n]]]);
s.head = runpin("head", [0n, 1684104552n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 1n]], [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]], 1n]]);
s.arity = runpin("arity", [0n, 521644110433n, 1n, [0n, [0n, [0n, [1n, [0n, 0n, 3n, 2n]], [0n, [0n, 0n, 3n, [0n, [0n, 0n, 1n, [0n, [2n, s.dec], 1n]], [0n, 1n, 2n]]], 0n]], [2n, 3n, [2n, 4n, [2n, 3n, [0n, 0n, 1n, [2n, 1n]]]]]], 1n]]);
s.len = runpin("len", [0n, 7234924n, 1n, [0n, [s.go, 0n], 1n]]);
s.get = runpin("get", [0n, 7628135n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 1n]]], [2n, 0n]], [0n, [0n, [0n, [2n, 2n], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]], [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]]], 2n]]]);
s.mut = runpin("mut", [0n, 7632237n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 3n]]], 3n], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], 1n]], [0n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 3n], 2n]], [0n, [0n, [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.dec], 1n]], 1n]], 2n], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 3n]]]]]);
s.idx = runpin("idx", [0n, 7890025n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.get], 1n], 2n]], 2n], 1n]]);
s.v0 = run("v0", [0n, 0n, 1n, 0n]);
s.v1 = runpin("v1", [0n, 12662n, 1n, [0n, [0n, [2n, [0n, 0n, 2n]], [2n, 0n]], 1n]]);
s.v2 = runpin("v2", [0n, 12918n, 2n, [0n, [0n, [0n, [2n, [0n, 0n, 3n]], [2n, 0n]], 2n], 1n]]);
s.NONE = run("NONE", 0n);
s.SOME = runpin("SOME", [0n, 1162694483n, 1n, [0n, [2n, 0n], 1n]]);
s.maybeCase = runpin("maybeCase", [0n, 1871435151934490239341n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]], 2n], [0n, 3n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.fromSome = runpin("fromSome", [0n, 7308620174401172070n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]);
s.cow = runpin("cow", [0n, 7827299n, 1n, [0n, [0n, [0n, 0n], [0n, 3n, 1n]], [2n, 0n]]]);
s.c0 = run("c0", [0n, 0n, 1n, 0n]);
s.c1 = run("c1", [0n, 0n, 2n, 0n]);
s.c2 = run("c2", [0n, 0n, 3n, 0n]);
s.c3 = run("c3", [0n, 0n, 4n, 0n]);
s.v0 = run("v0", [0n, 0n, 1n, 0n]);
s.v1 = run("v1", [0n, 0n, 2n, 0n]);
s.v2 = runpin("v2", [0n, 12918n, 2n, [0n, [0n, [0n, 0n, 3n, 0n], 2n], 1n]]);
s.v3 = runpin("v3", [0n, 13174n, 3n, [0n, [0n, [0n, [0n, 0n, 4n, 0n], 3n], 2n], 1n]]);
s.mkRow = runpin("mkRow", [0n, 512968780653n, 1n, [0n, [0n, [0n, 0n], 1n], [0n, [0n, s.go, 1n], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], 1n]]]]]);
s.isCow = runpin("isCow", [0n, 512967799657n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isFun], 1n]], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 0n], [0n, [0n, 0n, 1n, [0n, [2n, s.funName], 1n]], 1n]]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 0n], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]]);
s.isRow = runpin("isRow", [0n, 512968782697n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.arity], 1n]], 1n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.isCow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.head], 1n]], 1n]]]]);
s.__null = runpin("__null", [0n, 1819047278n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 1n]]]);
s.__switch = runpin("__switch", [0n, 114776364119923n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gte], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 3n]]], 2n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 3n]]]);
s.match = runpin("match", [0n, 448345170285n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__switch], 1n], 2n], 3n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]], 2n], 3n]]);
s.gen = runpin("gen", [0n, 7234919n, 2n, [0n, [0n, [0n, s.go, 2n], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], 1n]]]);
s.slice = runpin("slice", [0n, 435459550323n, 3n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], 3n], 2n]], [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.get], 1n], 2n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 2n], 3n]]], 1n], 2n]]]);
s.foldr = runpin("foldr", [0n, 491311099750n, 3n, [0n, [0n, [0n, [0n, [0n, s.go, 1n], 2n], 3n], [2n, 0n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 3n]]]);
s.foldl = runpin("foldl", [0n, 465541295974n, 3n, [0n, [0n, [0n, [0n, [0n, s.go, 1n], 3n], 2n], [2n, 0n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 3n]]]);
s.weld = runpin("weld", [0n, 1684825463n, 2n, [1n, [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 3n], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]]], [0n, [0n, [0n, [0n, 0n, 4n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lth], 1n], 2n]], 4n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 4n], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], 4n], 3n]], 2n]]], 1n], 2n], 3n]]]]);
s.tag = runpin("tag", [0n, 6775156n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 1n]], [0n, [0n, 0n, 2n, [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 2n], 1n]], 2n]], 1n]]]);
s.findIdx = runpin("findIdx", [0n, 33887263585626470n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, [0n, 0n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, 1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.SOME], 1n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]]], 3n]], 1n]], [2n, 0n]], [0n, [0n, 0n, 1n, [0n, [2n, s.tag], 1n]], 2n]]]);
s.elemIdx = runpin("elemIdx", [0n, 33887263736032357n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.findIdx], 1n], 2n]], [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 1n]], 2n]]);
s.put = runpin("put", [0n, 7632240n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.mut], 1n], 2n], 3n]], 2n], 3n], 1n]]);
s.rep = runpin("rep", [0n, 7366002n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], 2n], [0n, [0n, 0n, 2n, 1n], 1n]]]);
s.map = runpin("map", [0n, 7364973n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]], [0n, [0n, [0n, 0n, 3n, [0n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 3n], 2n]]], 1n], 2n]]]);
s.turn = runpin("turn", [0n, 1852994932n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], 2n], 1n]]);
s.rowAnd = runpin("rowAnd", [0n, 110424707526514n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], 1n], 1n]]);
s.rowOr = runpin("rowOr", [0n, 490959499122n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.or], 1n], 2n]], 0n], 1n]]);
s.sum = runpin("sum", [0n, 7173491n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 0n], 1n]]);
s.all = runpin("all", [0n, 7105633n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.rowAnd], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], 1n], 2n]]]);
s.any = runpin("any", [0n, 7958113n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.rowOr], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], 1n], 2n]]]);
s.cat = runpin("cat", [0n, 7627107n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.weld], 1n], 2n]], [0n, 0n, 1n, 0n]], 1n]]);
s.catMap = runpin("catMap", [0n, 123563213611363n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cat], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], 1n], 2n]]]);
s.zipWith = runpin("zipWith", [0n, 29401393365281146n, 3n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.min], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 3n]]], [0n, [0n, [0n, [0n, 0n, 4n, [0n, [0n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 4n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 4n], 3n]]], 1n], 2n], 3n]]]);
s.zip = runpin("zip", [0n, 7367034n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.zipWith], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.v2], 1n], 2n]]], 1n], 2n]]);
s.rowApply = runpin("rowApply", [0n, 8749491803511025522n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldl], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.apply], 1n], 2n]]], 1n], 2n]]);
s.rowRepel = runpin("rowRepel", [0n, 7810772709221560178n, 2n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.supply], 1n], 2n]]], 1n], 2n]]);
s.take = runpin("take", [0n, 1701536116n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.min], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]]], [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.get], 1n], 2n]], 2n]]]);
s.drop = runpin("drop", [0n, 1886351972n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]], 1n]], [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.get], 1n], 2n]], 2n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 3n], 1n]]], 1n], 2n]]]);
s.has = runpin("has", [0n, 7561576n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.any], 1n], 2n]], [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 1n]], 2n]]);
s.rev = runpin("rev", [0n, 7759218n, 1n, [1n, [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.gen], 1n], 2n]], 2n], [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.get], 1n], 2n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.sub], 1n], 2n]], 2n], [0n, [2n, 3n], 3n]]]], 1n], 2n]]]]);
s.chunks = runpin("chunks", [0n, 126905251883107n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 2n]]], [0n, 0n, 1n, 0n]], [0n, [0n, 0n, 1n, [0n, [2n, s.rev], 1n]], [0n, [0n, [0n, s.go, 1n], 2n], [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.div], 1n], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.roundUp], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]], 1n]], 1n]]]]]]);
s.WEIRD = runpin("WEIRD", [0n, 44n, 4n, [1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 0n], 4n]], 3n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.weld], 1n], 2n]], 3n], [0n, [0n, 0n, 2n, 0n], 4n]]], [0n, [2n, 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.v2], 1n], 2n]], 0n], [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.v3], 1n], 2n], 3n]], 0n, 124n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.weld], 1n], 2n]], [0n, [0n, 0n, 2n, 0n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.v2], 1n], 2n]], 4n], [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 5n]]]]], [0n, [0n, 0n, 1n, [0n, [2n, s.rev], 1n]], 5n]]]]]]]);
s.r = run("r", [0n, 0n, 1n, [0n, [2n, s.rev], 1n]]);
s.r3 = runpin("r3", [0n, 13170n, 3n, [0n, [0n, [0n, [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], [2n, 3n]], 3n], 2n], 1n]]);
s.ADD = runpin("ADD", [0n, 4473921n, 3n, [0n, [0n, 3n, 1n], 2n]]);
s.mkPin = runpin("mkPin", [0n, 474213280621n, 1n, [1n, [0n, [0n, 0n, 1n, [0n, [2n, s.arity], 1n]], 1n], [0n, [0n, [0n, 0n], 2n], [0n, [0n, s.go, 1n], 2n]]]]);
s.pinItem = runpin("pinItem", [0n, 30792322584045936n, 1n, [0n, s.go, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]);
s.isPin = runpin("isPin", [0n, 474213282665n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isFun], 1n]], 1n]], [0n, [0n, s.go, [0n, [0n, 0n, 1n, [0n, [2n, s.funArgs], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.checkPin = runpin("checkPin", [0n, 7955978638886004835n, 1n, [1n, [0n, [0n, 0n, 1n, [0n, [2n, s.mkPin], 1n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isPin], 1n]], 2n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.pinItem], 1n]], 2n]]]]]);
s.LEFT = runpin("LEFT", [0n, 1413891404n, 1n, [0n, [2n, 0n], 1n]]);
s.RIGHT = runpin("RIGHT", [0n, 361989884242n, 1n, [0n, [2n, 1n], 1n]]);
s.eitherCase = runpin("eitherCase", [0n, 479087398909535753365861n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, 3n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.fromRight = runpin("fromRight", [0n, 2147345410055597945446n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]], [0n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]]);
s.eitherCaseLeft = runpin("eitherCaseLeft", [0n, 2360872136943490377085716866034021n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]], [0n, 3n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.eitherOpen = runpin("eitherOpen", [0n, 521331527079940916013413n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]], 1n]]);
s.eitherOpenLeft = runpin("eitherOpenLeft", [0n, 2360872136985734505256122028681573n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], 1n], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.fromLeft = runpin("fromLeft", [0n, 8387502734952067686n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 2n]], [0n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]);
s.eitherGetRight = runpin("eitherGetRight", [0n, 2361031247207681090201113979021669n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]], 1n]]);
s.eitherGetLeft = runpin("eitherGetLeft", [0n, 9222156785211194373552062359909n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], 1n], [0n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]]]]);
s.eitherMap = runpin("eitherMap", [0n, 2073046722230225234277n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 2n]], [0n, [2n, 1n], [0n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]], [0n, [2n, 0n], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 2n]]]]);
s.NIL = run("NIL", 0n);
s.CONS = runpin("CONS", [0n, 1397641027n, 2n, [0n, [0n, [0n, 0n, 3n, 0n], 2n], 1n]]);
s.listCase = runpin("listCase", [0n, 7310293562496870764n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]], 2n], [0n, [0n, 3n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 1n]]]]);
s.listMap = runpin("listMap", [0n, 31632182685690220n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, 0n, 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]]], [0n, 1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]]]]]);
s.listTurn = runpin("listTurn", [0n, 7958552497108511084n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listMap], 1n], 2n]], 2n], 1n]]);
s.listHead = runpin("listHead", [0n, 7233173838399498604n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]], [2n, 0n]], [0n, [0n, 0n, 1n, [0n, [2n, s.SOME], 1n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]]]]);
s.listSafeHead = runpin("listSafeHead", [0n, 31066245081124103500198013292n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]]]);
s.listUnsafeHead = runpin("listUnsafeHead", [0n, 2035957437636549255989450520095084n, 1n, [[0n, 0n, 2n, [0n, [0n, [2n, s.listSafeHead], 1n], 2n]], 0n]]);
s.listFoldl = runpin("listFoldl", [0n, 1999484641010301233516n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 3n]], 2n], [1n, [0n, [0n, 1n, 2n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.seq], 1n], 2n]], 4n], [0n, [0n, [0n, 0n, 1n], 4n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 3n]]]]]]);
s.listFoldr = runpin("listFoldr", [0n, 2110165105452558543212n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 3n]], 2n], [0n, [0n, 1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 3n]], [0n, [0n, [0n, 0n, 1n], 2n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 3n]]]]]);
s.listMap = runpin("listMap", [0n, 31632182685690220n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, 0n, 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]]], [0n, 1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]]]]]);
s.listTurn = runpin("listTurn", [0n, 7958552497108511084n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listMap], 1n], 2n]], 2n], 1n]]);
s.listLen = runpin("listLen", [0n, 31073626483812716n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, 3n, 2n]], 0n], 1n]]);
s.listSum = runpin("listSum", [0n, 30809773757917548n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 0n], 1n]]);
s.listToRow = runpin("listToRow", [0n, 2203184141066258573676n, 1n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.supply], 1n], 2n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.listLen], 1n]], 1n]]], 1n]]);
s.listToRowReversed = runpin("listToRowReversed", [0n, 34163088154040235307013088222310917433708n, 1n, [0n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldl], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.apply], 1n], 2n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.cow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.listLen], 1n]], 1n]]], 1n]]);
s.listFromRow = runpin("listFromRow", [0n, 144387875732400566068013420n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.foldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.CONS], 1n], 2n]], 0n], 1n]]);
s.listAnd = runpin("listAnd", [0n, 28268725076715884n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.and], 1n], 2n]], 1n], 1n]]);
s.listOr = runpin("listOr", [0n, 125685581703532n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.or], 1n], 2n]], 0n], 1n]]);
s.listSum = runpin("listSum", [0n, 30809773757917548n, 1n, [0n, [[0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listFoldr], 1n], 2n], 3n]], [0n, 0n, 2n, [0n, [0n, [2n, s.add], 1n], 2n]], 0n], 1n]]);
s.listAll = runpin("listAll", [0n, 30518325867145580n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.listAnd], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listMap], 1n], 2n]], 1n], 2n]]]);
s.listAny = runpin("listAny", [0n, 34179699587639660n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.listOr], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listMap], 1n], 2n]], 1n], 2n]]]);
s.listHas = runpin("listHas", [0n, 32476586140985708n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listAny], 1n], 2n]], [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 1n]], 2n]]);
s.listEnumFrom = runpin("listEnumFrom", [0n, 33868596485442300195611306348n, 1n, [0n, [0n, [0n, 0n, 3n, 0n], [0n, 0n, [0n, 3n, 1n]]], 1n]]);
s.listWeld = runpin("listWeld", [0n, 7236270127567825260n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]], 2n], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, 0n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 1n]], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]]]]);
s.listCat = runpin("listCat", [0n, 32758039642859884n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]], [2n, 0n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listWeld], 1n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]], [0n, 0n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 1n]]]]]);
s.listTake = runpin("listTake", [0n, 7308041835697629548n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.ifNot], 1n], 2n], 3n]], 1n], [2n, 0n]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.dec], 1n]], 1n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]]]]]);
s.listDrop = runpin("listDrop", [0n, 8101819892999874924n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.ifNot], 1n], 2n], 3n]], 1n], 2n], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.dec], 1n]], 1n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]]]]]);
s.listDigits = runpin("listDigits", [0n, 545219562997598823606636n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.ifNot], 1n], 2n], 3n]], 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.CONS], 1n], 2n]], 48n], [2n, 0n]]], [0n, [0n, s.loop, 1n], [2n, 0n]]]]);
s.digits = runpin("digits", [0n, 126943821785444n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.listToRow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.listDigits], 1n]], 1n]]]);
s.listZipWith = runpin("listZipWith", [0n, 126278022960713768430168428n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 3n]], [2n, 0n]], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, [0n, 0n, 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 3n]]], [0n, [0n, 1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 3n]]]]]]);
s.listZip = runpin("listZip", [0n, 31641034613287276n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listZipWith], 1n], 2n], 3n]], [0n, [2n, [0n, 0n, 3n]], [2n, 0n]]], 2n], 1n]]);
s.listFilter = runpin("listFilter", [0n, 540221289394541425813868n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n], [1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, 1n, 3n]], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, 0n, 1n], 4n]], 3n]], [0n, [0n, 0n, 1n], 4n]]]]]]);
s.listNull = runpin("listNull", [0n, 7812748433402587500n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]]);
s.listMinimumOn = runpin("listMinimumOn", [0n, 8739679519794472115484774066540n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 3n]], 2n], [1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 3n], [0n, [0n, [0n, 0n, 1n], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.lth], 1n], 2n]], [0n, 1n, 4n]], [0n, 1n, 2n]]], 4n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 3n]]]]]);
s.listSortOn = runpin("listSortOn", [0n, 520925996788943999428972n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], [2n, 0n]], [1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.listMinimumOn], 1n], 2n], 3n]], 1n], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n], 2n]], [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, 0n, 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listFilter], 1n], 2n]], [0n, [0n, [0n, 0n, 3n, [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.eql], 1n], 2n]], 2n], [0n, 1n, 3n]]]], 1n], [0n, 1n, 3n]]], 2n]]], 3n]]]]);
s.sortOn = runpin("sortOn", [0n, 121287535128435n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, s.listToRow], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listSortOn], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.listFromRow], 1n]], 2n]]]]);
s.unApp = runpin("unApp", [0n, 482919673461n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 1n]], [0n, [0n, 0n, [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.CONS], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]], 2n]]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.CONS], 1n], 2n]], 1n], 2n]]]);
s.inspect = runpin("inspect", [0n, 32760384627895913n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isApp], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.listToRow], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.unApp], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.car], 1n]], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.CONS], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]], [2n, 0n]]]]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isFun], 1n]], 1n]], [0n, [0n, [0n, [0n, [0n, 0n, 5n, 0n], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.funArgs], 1n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.funName], 1n]], 1n]], [2n, 0n]]], 1n]]]);
s.fullInspection = runpin("fullInspection", [0n, 2239892019071578910533237129114982n, 1n, [1n, [0n, [0n, 0n, 1n, [0n, [2n, s.inspect], 1n]], 1n], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 2n]], 2n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], 0n], 2n]]]]);
s.runVec = runpin("runVec", [0n, 109286892926322n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.rowApply], 1n], 2n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.drop], 1n], 2n]], 1n], 1n]]]);
s.rebuild = runpin("rebuild", [0n, 28266697867814258n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 1n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.runVec], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], 0n], 1n]]]]);
s.tabLen = run("tabLen", [0n, 0n, 1n, [0n, [2n, s.len], 1n]]);
s.tabIdx = runpin("tabIdx", [0n, 132372123246964n, 2n, [1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.elemIdx], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.head], 1n]], 2n]]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 3n]], [2n, 0n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 3n]], 2n]]]]);
s.look = runpin("look", [0n, 1802465132n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.tabIdx], 1n], 2n]], 2n], 1n]]);
s.tabKeys = runpin("tabKeys", [0n, 32503098285121908n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.head], 1n]], 1n]]]);
s.tabVals = runpin("tabVals", [0n, 32488787638641012n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.look], 1n], 2n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.tabKeys], 1n]], 1n]]]);
s.hasKey = runpin("hasKey", [0n, 133475964510568n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.has], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.tabKeys], 1n]], 2n]]]);
s.tabSwitch = runpin("tabSwitch", [0n, 1925627852534067650932n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.hasKey], 1n], 2n]], 1n], 3n]]], 2n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.tabIdx], 1n], 2n]], 1n], 3n]]]);
s.tabMatch = runpin("tabMatch", [0n, 7521983763897803124n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.tabSwitch], 1n], 2n], 3n]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n], 1n]], 2n], 3n]]);
s.tabFromPairs = runpin("tabFromPairs", [0n, 35729091316501037923933774196n, 1n, [1n, [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.sortOn], 1n], 2n]], [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n]], 1n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.rowRepel], 1n], 2n]], [0n, [0n, [0n, 0n], [0n, 3n, [0n, [0n, 0n, 1n, [0n, [2n, s.len], 1n]], 2n]]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 0n]], 2n]]], [0n, [[0n, 0n, 2n, [0n, [0n, [2n, s.map], 1n], 2n]], [[0n, 0n, 2n, [0n, [0n, [2n, s.idx], 1n], 2n]], 1n]], 2n]]]]);
s.tabToPairs = runpin("tabToPairs", [0n, 545182667793297899151732n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.listToRow], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listZip], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, s.listFromRow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.tabKeys], 1n]], 1n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.listFromRow], 1n]], 1n]]]]);
s.tabToPairList = runpin("tabToPairList", [0n, 9226184926005552341199528026484n, 1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.listMap], 1n], 2n]], [0n, [0n, 0n, 2n, [0n, [0n, [0n, 0n, 3n, 0n], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.look], 1n], 2n]], 1n], 2n]], 2n]], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.listFromRow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.tabKeys], 1n]], 1n]]]]);
s.tabToList = runpin("tabToList", [0n, 2148138574778265133428n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, s.listFromRow], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, s.tabToPairs], 1n]], 1n]]]);
s.tabMut = runpin("tabMut", [0n, 128047158288756n, 3n, [1n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.elemIdx], 1n], 2n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, s.tabKeys], 1n]], 3n]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.__if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.isNat], 1n]], 4n]], [0n, [0n, 0n, 1n, [0n, [2n, s.tabFromPairs], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, s.weld], 1n], 2n]], [0n, [0n, 0n, 2n, 0n], [0n, [0n, [0n, 0n, 3n, 0n], 2n], 1n]]], [0n, [0n, 0n, 1n, [0n, [2n, s.tabToPairs], 1n]], 3n]]]], [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.mut], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, s.cdr], 1n]], 4n]], 2n], 3n]]]]);
s.tabPut = runpin("tabPut", [0n, 128047208620404n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, s.tabMut], 1n], 2n], 3n]], 2n], 3n], 1n]]);
*/

export let sire : any = s;
