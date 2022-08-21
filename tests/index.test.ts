import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }

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
    expectFanLine(3n, 5n).toStrictEqual(6n);
  });

  // test('testing wut nat check `1 0 0 3 5` -> 6', () => {
  //   expectFanLine(1n, 0n, 0n, 3n, 5n).toStrictEqual(6n);
  // });

  // test('testing integer zero check `2 10 11 0` -> 10', () => {
  //   expectFanLine(2n, 10n, 11n, 0n).toStrictEqual(10n);
  // });

  // test('testing integer positive check `2 10 3 15` -> 15', () => {
  //   expectFanLine(2n, 10n, 3n, 15n).toStrictEqual(15n);
  // });

});

// describe('compiler tests', () => {
//   describe("function execution tests", () => {
//     test('test function application ((0 97 1 1) 5)', () => {
//       let f = line(0n, 97n, 1n, 1n);
//       expect((f as any).x(5n)).toStrictEqual(5n);
//       expect(F(A(f, 5n))).toStrictEqual(5n);
//     });

//     test('test function application ((0 98 1 (2 7)) 5)', () => {
//       let f = line(0n, 98n, 1n, line(2n, 7n));
//       expect(F(A(f, 5n))).toStrictEqual(7n);
//     });
//   });
// });


// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
