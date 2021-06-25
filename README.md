# Data Schema

This library contains a way to define data schemas that can be parsed to and from buffers.
The purpose and implementation of this library is similar to `@athombv/data-types` but it makes it easier to add custom data types and improves handling of "unsized" properties.

## Installation

```sh
npm install github:tjallingt/node-data-schema
```

## Usage

Simple usage of this library looks like this:

```js
import { define, types } from 'data-schema';

const schema = define(types.struct({
  first: types.bigEndian.uint8,
  secondAndThird: types.bigEndian.uint16,
}));

const result = schema.fromBuffer(Buffer.from('01020304', 'hex'));

assert.deepStrictEqual(result, {
  first: 0x01,
  secondAndThird: 0x0203,
});

const output = schema.toBuffer({
  first: 0x01,
  secondAndThird: 0x0203,
});

assert.deepStrictEqual(output, Buffer.from('010203', 'hex'));
```
