import * as p from '../src/index';

function expectFanLine(...args : (bigint | p.Fan)[]) {
  let prev = asFan(args[0])
  for (let i = 1; i < args.length; ++i) {
    prev = p.push(prev, asFan(args[i]));
  }

  return expect(prev);
}

function asFan(x : bigint | p.Fan) {
  if (typeof x == 'bigint') {
    return p.mkNat(x);
  } else {
    return x;
  }
}

function line(...args : (bigint | p.Fan)[]) {
  let prev = asFan(args[0]);
  for (let i = 1; i < args.length; ++i) {
    prev = p.push(prev, asFan(args[i]));
  }

  return prev;
}

describe('testing nat evaluation', () => {
  // test('testing wut check NAT `1 `', () => {
  // });

  test('testing wut nat check `1 0 0 3 5` -> 6', () => {
    expectFanLine(1n, 0n, 0n, 3n, 5n).toStrictEqual(p.mkNat(6n));
  });

  test('testing integer zero check `2 10 11 0` -> 10', () => {
    expectFanLine(2n, 10n, 11n, 0n).toStrictEqual(p.mkNat(10n));
  });

  test('testing integer positive check `2 10 3 15` -> 15', () => {
    expectFanLine(2n, 10n, 3n, 15n).toStrictEqual(p.mkNat(15n));
  });

  test('testing increment `3 5` -> 6', () => {
    expectFanLine(3n, 5n).toStrictEqual(p.mkNat(6n));
  });
});

describe('compiler tests', () => {
  describe('first pass FAN to Run tests', () => {
    test('raw nat within arg range is a reference', () => {
      expect(p.fanToRun(1, p.mkNat(1n))).toStrictEqual(
        [1, { t: p.RunKind.REF, r: 1 }]);
    });

    test('testing raw unmatched large constant', () => {
      expect(p.fanToRun(0, p.mkNat(50n))).toStrictEqual(
        [0, { t: p.RunKind.CNS, c: p.mkNat(50n) }]);
    });

    test('testing `(2 x)` returns x', () => {
      expect(p.fanToRun(1, p.mkApp(p.mkNat(2n), p.mkNat(50n))))
        .toStrictEqual(
          [1, { t: p.RunKind.CNS, c: p.mkNat(50n) }]);
    });

    test('testing `(0 1 2)` case with refs', () => {
      expect(p.fanToRun(2, p.mkApp(p.mkApp(p.mkNat(0n), p.mkNat(1n)),
                                   p.mkNat(2n))))
        .toStrictEqual([2, { t: p.RunKind.KAL,
                             f: { t: p.RunKind.REF, r: 1 },
                             x: { t: p.RunKind.REF, r: 2 }}]);

    });

    test('testing `(1 1 2)`', () => {
      expect(p.fanToRun(1, p.mkApp(p.mkApp(p.mkNat(1n), p.mkNat(1n)),
                                   p.mkNat(2n))))
        .toStrictEqual([2, { t: p.RunKind.LET,
                             i: 2,
                             v: { t: p.RunKind.REF, r: 1 },
                             f: { t: p.RunKind.REF, r: 2 } } ]);
    });
  });

  describe("function execution tests", () => {
    test('test function application ((0 1 1 1) 5)', () => {
      let f = line(0n, 1n, 1n, 1n);
      expect(p.push(f, p.mkNat(5n))).toStrictEqual(p.mkNat(5n));
    });

    test('test function application ((0 1 1 (2 7)) 5)', () => {
      let f = line(0n, 1n, 1n, line(2n, 7n));
      expect(p.push(f, p.mkNat(5n))).toStrictEqual(p.mkNat(7n));
    });
  });
});


// Local Variables:
// typescript-indent-level: 2
// End:
