'use strict';

import { strict as assert } from 'assert';

import { define, types } from '../src/index';

describe('data-scheme can define parsers', () => {
  it('supports simple types', () => {
    const scheme = define(types.struct({
      first: types.byte,
      second: types.byte,
    }));

    const result = scheme.fromBuffer(Buffer.from('0102', 'hex'));

    assert.deepStrictEqual(result, {
      first: 0x01,
      second: 0x02,
    });

    const output = scheme.toBuffer({
      first: 0x01,
      second: 0x02,
    });

    assert.deepStrictEqual(output, Buffer.from('0102', 'hex'));
  });

  // ====================================================================

  it('supports an unsized buffer', () => {
    const scheme = define(types.struct({
      buf: types.buffer(),
    }));

    const result = scheme.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      buf: Buffer.from('010203040506', 'hex'),
    });

    const output = scheme.toBuffer({
      buf: Buffer.from('010203040506', 'hex'),
    });

    assert.deepStrictEqual(output, Buffer.from('010203040506', 'hex'));
  });

  // ====================================================================

  it('supports an unsized buffer with parameters before and after', () => {
    const scheme = define(types.struct({
      before: types.byte,
      buf: types.buffer(),
      after: types.byte,
    }));

    const result = scheme.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      before: 0x01,
      buf: Buffer.from('02030405', 'hex'),
      after: 0x06,
    });

    const output = scheme.toBuffer({
      before: 0x01,
      buf: Buffer.from('02030405', 'hex'),
      after: 0x06,
    });

    assert.deepStrictEqual(output, Buffer.from('010203040506', 'hex'));
  });

  // ====================================================================

  it('supports a buffer with static size', () => {
    const scheme = define(types.struct({
      buf: types.fixedSizeBuffer(3),
    }));

    const result = scheme.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      buf: Buffer.from('010203', 'hex'),
    });

    const output = scheme.toBuffer({
      buf: Buffer.from('010203040506', 'hex'),
    });

    assert.deepStrictEqual(output, Buffer.from('010203', 'hex'));
  });

  // ====================================================================

  it('supports grouped bits', () => {
    const scheme = define(types.struct({
      properties: types.groupBits({
        first: 4,
        second: 8,
        third: 4,
      }),
    }));

    const result = scheme.fromBuffer(Buffer.from([0b1001_0011, 0b1100_0110]));

    assert.deepStrictEqual(result, {
      properties: {
        first: 0b1001,
        second: 0b0011_1100,
        third: 0b0110,
      },
    });

    const output = scheme.toBuffer({
      properties: {
        first: 0b1001,
        second: 0b0011_1100,
        third: 0b0110,
      },
    });

    assert.deepStrictEqual(output, Buffer.from([0b1001_0011, 0b1100_0110]));
  });

  // ====================================================================

  it('supports an array of uint', () => {
    const scheme = define(types.struct({
      list: types.array(types.bigEndian.uint16),
    }));

    const result = scheme.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      list: [0x0102, 0x0304, 0x0506],
    });

    const output = scheme.toBuffer({
      list: [0x0102, 0x0304, 0x0506],
    });

    assert.deepStrictEqual(output, Buffer.from('010203040506', 'hex'));
  });

  // ====================================================================

  it('supports an array of structs', () => {
    const scheme = define(types.struct({
      list: types.array(types.struct({ value: types.byte })),
    }));

    const result = scheme.fromBuffer(Buffer.from('0102', 'hex'));

    assert.deepStrictEqual(result, {
      list: [{ value: 0x01 }, { value: 0x02 }],
    });

    const output = scheme.toBuffer({
      list: [{ value: 0x01 }, { value: 0x02 }],
    });

    assert.deepStrictEqual(output, Buffer.from('0102', 'hex'));
  });

  // ====================================================================

  it('supports an array with parameters before and after', () => {
    const scheme = define(types.struct({
      before: types.byte,
      list: types.array(
        types.struct({
          one: types.byte,
          two: types.byte,
        })
      ),
      after: types.bigEndian.uint16,
    }));

    const result = scheme.fromBuffer(Buffer.from('01020304050607', 'hex'));

    assert.deepStrictEqual(result, {
      before: 0x01,
      list: [
        { one: 0x02, two: 0x03 },
        { one: 0x04, two: 0x05 },
      ],
      after: 0x0607,
    });

    const output = scheme.toBuffer({
      before: 0x01,
      list: [
        { one: 0x02, two: 0x03 },
        { one: 0x04, two: 0x05 },
      ],
      after: 0x0607,
    });

    assert.deepStrictEqual(output, Buffer.from('01020304050607', 'hex'));
  });
});
