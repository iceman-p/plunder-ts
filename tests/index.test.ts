import * as p from '../src/index';

function plnNat(n : bigint) {
    return p.nodVal(p.mkNat(n));
}

function expectPlnLine(args : p.Pln[]) {
    let prev = args[0]
    for (let i = 1; i < args.length; ++i) {
        prev = p.push(prev, args[i]);
    }

    return expect(prev);
}

describe('testing nat evaluation', () => {
    test('testing integer zero check `2 10 11 0` -> 10', () => {
        expectPlnLine([plnNat(2n), plnNat(10n), plnNat(11n), plnNat(0n)])
            .toStrictEqual(plnNat(10n));
    });

    test('testing integer positive check `2 10 3 15` -> 15', () => {
        expectPlnLine([plnNat(2n), plnNat(10n), plnNat(3n), plnNat(15n)])
            .toStrictEqual(plnNat(15n));
    });

    test('testing increment `3 5` -> 6', () => {
        expectPlnLine([plnNat(3n), plnNat(5n)]).toStrictEqual(plnNat(6n));
    });
});
