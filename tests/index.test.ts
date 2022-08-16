import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

function expectFanLine(...args : Fan[]) {
  let prev = p.AP(args[0], ...args.slice(1));
  return expect(F(prev));
}

function line(...args : Fan[]) {
  return F(p.AP(args[0], ...args.slice(1)));
}

describe('testing nat evaluation', () => {
  // test('testing wut check NAT `1 `', () => {
  // });

  test('testing increment `3 5` -> 6', () => {
    expectFanLine(N(3n), N(5n)).toStrictEqual(N(6n));
  });

  test('testing wut nat check `1 0 0 3 5` -> 6', () => {
    expectFanLine(N(1n), N(0n), N(0n), N(3n), N(5n)).toStrictEqual(N(6n));
  });

  test('testing integer zero check `2 10 11 0` -> 10', () => {
    expectFanLine(N(2n), N(10n), N(11n), N(0n)).toStrictEqual(N(10n));
  });

  test('testing integer positive check `2 10 3 15` -> 15', () => {
    expectFanLine(N(2n), N(10n), N(3n), N(15n)).toStrictEqual(N(15n));
  });

});

describe('compiler tests', () => {
  describe("function execution tests", () => {
    test('test function application ((0 97 1 1) 5)', () => {
      let f = line(N(0n), N(97n), N(1n), N(1n));
      expect((f as any).x(N(5n))).toStrictEqual(N(5n));
      expect(F(A(f, N(5n)))).toStrictEqual(N(5n));
    });

    test('test function application ((0 98 1 (2 7)) 5)', () => {
      let f = line(N(0n), N(98n), N(1n), line(N(2n), N(7n)));
      expect(F(A(f, N(5n)))).toStrictEqual(N(7n));
    });
  });
});


// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
