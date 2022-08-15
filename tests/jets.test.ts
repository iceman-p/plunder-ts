import { Nat, FanKind, Fan, DatKind, Dat } from "../src/types"

import * as p from '../src/index';
import * as s from '../src/sire';
import { sire } from '../src/sire';

function E(val:Fan)          : Fan { return p.whnf(val);       }
function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

function R(...i:s.ExportType[]) : Fan { return E(s.arrayToExport(i)); }

function mkCow(n:Nat) : Fan {
  return { t: FanKind.DAT, d: { t: DatKind.COW, z: n } };
}

function mkRow(r:Fan[]) : Fan {
  return { t: FanKind.DAT, d: { t: DatKind.ROW, r:r } };
}

describe('test data jet matching', () => {
  describe('row constructor tests', () => {
    test('parse raw vector constructor', () => {
      expect(R(0n, 0n, 5n, 0n)).toStrictEqual(mkCow(4n));
    });

    test('parse named sire cow constructor', () => {
      expect(R(sire.cow, 4n)).toStrictEqual(mkCow(4n));
    });

    test('sire matches isCow', () => {
      expect(R(sire.isCow, [sire.cow, 3n])).toStrictEqual(N(1n));
    });

    test('calling constructor makes row', () => {
      expect(R(sire.cow, 4n, 1n, 2n, 3n, 4n)).toStrictEqual(
        mkRow([N(1n), N(2n), N(3n), N(4n)]));
    });
  });
});

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
