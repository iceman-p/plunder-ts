import * as p from '../src/index';

describe('testing push', () => {
    test('testing increment `3 5` -> 6', () => {
        expect(p.push(p.nodVal(p.mkNat(3n)), p.nodVal(p.mkNat(5n)))).toStrictEqual(
            p.nodVal(p.mkNat(6n)));
    });
});
