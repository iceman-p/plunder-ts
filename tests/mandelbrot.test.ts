import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as s from '../src/sire';

import { mandelbrot } from '../src/mandelbrot';

function E(val:Fan)          : Fan { return p.whnf(val);       }
function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }

function R(...i:s.ExportType[]) : Fan { return E(s.arrayToExport(i)); }

describe('mandelbrot tests', () => {
  test('4x4', () => {
    let x = F(R(mandelbrot.mandelbrotPpm, 4n, 4n));
    console.log(x);
  });
});


// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
