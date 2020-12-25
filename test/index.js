'use strict';

const assert = require('assert').strict;

const { define, types } = require('../lib/index.js');

describe('data-scheme define and types', () => {
  it('can define a simple type', () => {
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

  it('can define a type with an unsized buffer', () => {
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

  it('can define a type with a unsized buffer with parameters before and after', () => {
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

  it('can define a type with a buffer with static size', () => {
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
});
