# Data Scheme

This library contains a way to define data schemes that can be parsed to and from buffers.
The purpose and implementation of this library is similar to `@athombv/data-types`, the reason this library exists is mostly to add support for schemes needed to describe Z-Wave data types.

## Installation

```sh
npm install github:athomb/node-data-scheme
```

## Usage

Simple usage of this library looks like this:

```js
import { Struct, types } from 'data-scheme';

const scheme = Struct({
  first: types.bigEndian.uint8,
  secondAndThird: types.bigEndian.uint16,
});

const result = scheme.fromBuffer(Buffer.from('01020304', 'hex'));

assert.deepStrictEqual(result, {
  first: 0x01,
  secondAndThird: 0x0203,
});

const output = scheme.toBuffer({
  first: 0x01,
  secondAndThird: 0x0203,
});

assert.deepStrictEqual(output, Buffer.from('010203', 'hex'));
```
