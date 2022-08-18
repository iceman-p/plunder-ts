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
      expect(R(sire.cow, 4n, 4n, 3n, 2n, 1n)).toStrictEqual(
        mkRow([N(1n), N(2n), N(3n), N(4n)]));
    });

    test('row constructor identity eq', () => {
      expect(R(sire.cow, 4n)).toStrictEqual(R(sire.cow, 4n));
    });

    test('row constructor returned on call', () => {
      expect(R(sire.cow, 4n, 4n, 3n, 2n, 1n, 7n)).toStrictEqual(
        R(sire.cow, 4n));
    });

    test('row isApp', () => {
      expect(F(R(sire.isApp, [sire.cow, 3n, 3n, 2n, 1n]))).toStrictEqual(N(1n));
    });
  });

  describe('pin tests', () => {
    test('isPin cow', () => {
      expect(R(sire.isPin, sire.cow)).toStrictEqual(N(1n));
    });
    test('isPin | cdr cow', () => {
      expect(R(sire.isPin, R(sire.cdr, sire.cow))).toStrictEqual(N(0n));
    });
  });

  describe('row jet tests', () => {
    test('match isRow', () => {
      expect(R(sire.isRow, [sire.cow, 1n, 5n])).toStrictEqual(N(1n));
    });

    test('weld two rows', () => {
      expect(F(R(sire.weld, F(R(sire.cow, 1n, 5n)), F(R(sire.cow, 1n, 10n)))))
        .toStrictEqual({ t: FanKind.DAT,
                         d: { t: DatKind.ROW, r: [N(5n), N(10n) ] }});

    });

    // Ensure manual destructuring of the row works.
    test('car row', () => {
      expect(F(R(sire.car, [sire.cow, 2n, 2n, 1n])))
        .toStrictEqual(R(R(sire.cow, 2n), 2n));
    });

    test('cdr row', () => {
      expect(F(R(sire.cdr, [sire.cow, 2n, 2n, 1n])))
        .toStrictEqual(N(1n));
    });

    test('get', () => {
      expect(F(R(sire.get, [sire.cow, 3n, 3n, 2n, 1n], N(2n))))
        .toStrictEqual(N(3n));
    });
  });
});

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
