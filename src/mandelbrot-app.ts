import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as s from '../src/sire';

import { mandelbrot } from '../src/mandelbrot';

function E(val:Fan)          : Fan { return p.whnf(val);       }
function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }

function R(...i:s.ExportType[]) : Fan { return E(s.arrayToExport(i)); }

let x = F(R(mandelbrot.mandelbrotPpm, 16n, 16n));
console.log(x);
