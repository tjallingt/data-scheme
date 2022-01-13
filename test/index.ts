'use strict';

import { strict as assert } from 'assert';
import { type } from 'os';

import { define, types, doublepass } from '../src/index';

describe('data-schema can define parsers', () => {
  it('supports simple types', () => {
    const schema = define(types.struct({
      first: types.byte,
      second: types.byte,
    }));

    const result = schema.fromBuffer(Buffer.from('0102', 'hex'));

    assert.deepStrictEqual(result, {
      first: 0x01,
      second: 0x02,
    });

    const output = schema.toBuffer({
      first: 0x01,
      second: 0x02,
    });

    assert.deepStrictEqual(output, Buffer.from('0102', 'hex'));
  });

  // ====================================================================

  it('supports an unsized buffer', () => {
    const schema = define(types.struct({
      buf: types.buffer(),
    }));

    const result = schema.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      buf: Buffer.from('010203040506', 'hex'),
    });

    const output = schema.toBuffer({
      buf: Buffer.from('010203040506', 'hex'),
    });

    assert.deepStrictEqual(output, Buffer.from('010203040506', 'hex'));
  });

  // ====================================================================

  it('supports an unsized buffer with parameters before and after', () => {
    const schema = define(types.struct({
      before: types.byte,
      buf: types.buffer(),
      after: types.byte,
    }));

    const result = schema.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      before: 0x01,
      buf: Buffer.from('02030405', 'hex'),
      after: 0x06,
    });

    const output = schema.toBuffer({
      before: 0x01,
      buf: Buffer.from('02030405', 'hex'),
      after: 0x06,
    });

    assert.deepStrictEqual(output, Buffer.from('010203040506', 'hex'));
  });

  // ====================================================================

  it('supports a buffer with static size', () => {
    const schema = define(types.struct({
      buf: types.fixedSizeBuffer(3),
    }));

    const result = schema.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      buf: Buffer.from('010203', 'hex'),
    });

    const output = schema.toBuffer({
      buf: Buffer.from('010203040506', 'hex'),
    });

    assert.deepStrictEqual(output, Buffer.from('010203', 'hex'));
  });

  // ====================================================================

  it('supports grouped bits', () => {
    const schema = define(types.struct({
      properties: types.groupBits({
        first: 4,
        second: 8,
        third: 4,
      }),
    }));

    const result = schema.fromBuffer(Buffer.from([0b1001_0011, 0b1100_0110]));

    assert.deepStrictEqual(result, {
      properties: {
        first: 0b1001,
        second: 0b0011_1100,
        third: 0b0110,
      },
    });

    const output = schema.toBuffer({
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
    const schema = define(types.struct({
      list: types.array(types.bigEndian.uint16),
    }));

    const result = schema.fromBuffer(Buffer.from('010203040506', 'hex'));

    assert.deepStrictEqual(result, {
      list: [0x0102, 0x0304, 0x0506],
    });

    const output = schema.toBuffer({
      list: [0x0102, 0x0304, 0x0506],
    });

    assert.deepStrictEqual(output, Buffer.from('010203040506', 'hex'));
  });

  // ====================================================================

  it('supports an array of structs', () => {
    const schema = define(types.struct({
      list: types.array(types.struct({ value: types.byte })),
    }));

    const result = schema.fromBuffer(Buffer.from('0102', 'hex'));

    assert.deepStrictEqual(result, {
      list: [{ value: 0x01 }, { value: 0x02 }],
    });

    const output = schema.toBuffer({
      list: [{ value: 0x01 }, { value: 0x02 }],
    });

    assert.deepStrictEqual(output, Buffer.from('0102', 'hex'));
  });

  // ====================================================================

  it('supports an array with parameters before and after', () => {
    const schema = define(types.struct({
      before: types.byte,
      list: types.array(
        types.struct({
          one: types.byte,
          two: types.byte,
        })
      ),
      after: types.bigEndian.uint16,
    }));

    const result = schema.fromBuffer(Buffer.from('01020304050607', 'hex'));

    assert.deepStrictEqual(result, {
      before: 0x01,
      list: [
        { one: 0x02, two: 0x03 },
        { one: 0x04, two: 0x05 },
      ],
      after: 0x0607,
    });

    const output = schema.toBuffer({
      before: 0x01,
      list: [
        { one: 0x02, two: 0x03 },
        { one: 0x04, two: 0x05 },
      ],
      after: 0x0607,
    });

    assert.deepStrictEqual(output, Buffer.from('01020304050607', 'hex'));
  });

  it('supports optional types', () => {
    const schema = define(types.struct({
      before: types.byte,
      optionalValue: types.optional(types.byte),
    }));

    const resultPresent = schema.fromBuffer(Buffer.from('0102', 'hex'));

    assert.deepStrictEqual(resultPresent, {
      before: 0x01,
      optionalValue: 0x02,
    });

    const resultNotPresent = schema.fromBuffer(Buffer.from('00', 'hex'));

    assert.deepStrictEqual(resultNotPresent, {
      before: 0x00,
      optionalValue: undefined,
    });

    const outputPresent = schema.toBuffer({
      before: 0x01,
      optionalValue: 0x02,
    });

    assert.deepStrictEqual(outputPresent, Buffer.from('0102', 'hex'));

    const outputNotPresent = schema.toBuffer({
      before: 0x01,
    });

    assert.deepStrictEqual(outputNotPresent, Buffer.from('01', 'hex'));
  });

  it('supports staged parsing', () => {
    const sizePrefixedString = doublepass(
      types.byte,
      (size) => types.fixedSizeString(size),
      (size, text) => text,
      (text) => text.length,
    );

    const schema = define(types.struct({
      first: sizePrefixedString,
      second: sizePrefixedString,
    }))

    const result = schema.fromBuffer(Buffer.from('04746573740431323334', 'hex'));

    assert.deepStrictEqual(result, { first: 'test', second: '1234' });

    const output = schema.toBuffer({ first: 'test', second: '1234' });

    assert.deepStrictEqual(output, Buffer.from('04746573740431323334', 'hex'));
  });

  it('supports staged parsing 2', () => {
    const schema = define(doublepass(
      types.struct({ isPresent: types.byte, first: types.byte }),
      (data) => types.struct({ second: data.isPresent ? types.byte : types.none }),
      (first, second) => ({ first: first.first, second: second.second }),
      (data) => ({ ...data, isPresent: data.second !== undefined ? 255 : 0 }),
    ));

    const result = schema.fromBuffer(Buffer.from('ff0102', 'hex'));

    assert.deepStrictEqual(result, { first: 0x01, second: 0x02 });

    const output = schema.toBuffer({ first: 0x01, second: 0x02 });

    assert.deepStrictEqual(output, Buffer.from('ff0102', 'hex'));
  });
});
