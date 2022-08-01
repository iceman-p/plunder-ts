import * as p from '../src/index';

function expectFanLine(args : p.Fan[]) {
    let prev = args[0]
    for (let i = 1; i < args.length; ++i) {
        prev = p.push(prev, args[i]);
    }

    return expect(prev);
}

describe('testing nat evaluation', () => {
    // test('testing wut check NAT `1 `', () => {
    // });

    test('testing integer zero check `2 10 11 0` -> 10', () => {
        expectFanLine([p.mkNat(2n), p.mkNat(10n), p.mkNat(11n), p.mkNat(0n)])
            .toStrictEqual(p.mkNat(10n));
    });

    test('testing integer positive check `2 10 3 15` -> 15', () => {
        expectFanLine([p.mkNat(2n), p.mkNat(10n), p.mkNat(3n), p.mkNat(15n)])
            .toStrictEqual(p.mkNat(15n));
    });

    test('testing increment `3 5` -> 6', () => {
        expectFanLine([p.mkNat(3n), p.mkNat(5n)]).toStrictEqual(p.mkNat(6n));
    });
});

