import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as s from '../src/sire';

import { mandelbrot } from '../src/mandelbrot';

const express = require('express');
const app = express();

function E(val:Fan)          : Fan { return p.whnf(val);       }
function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

function R(...i:s.ExportType[]) : Fan { return E(s.arrayToExport(i)); }

app.get('/', doit);

function doit(req : any, res : any) {
    let x = F(R(mandelbrot.mandelbrotPpm, 16n, 16n));
    console.log(x);
    setTimeout(() => res.send('Success'), 100);
}

app.listen(3030, 'localhost', () => console.log(`Listening on localhost:3030`));
