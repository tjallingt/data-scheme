'use strict';

// This file defines all Little Endian number parsers

function uint(size) {
  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      const value = buffer.readUIntLE(offset, size);
      return { size, value };
    },

    toBuffer(value) {
      const result = Buffer.allocUnsafe(size);
      result.writeUIntLE(value, 0, size);
      return result;
    },
  };
}

function int(size) {
  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      const value = buffer.readIntLE(offset, size);
      return { size, value };
    },

    toBuffer(value) {
      const result = Buffer.allocUnsafe(size);
      result.writeIntLE(value, 0, size);
      return result;
    },
  };
}

const SIZE_FLOAT = 4;
const float = {
  staticSize: SIZE_FLOAT,

  fromBuffer(buffer, offset) {
    const value = buffer.readFloatLE(offset);
    return { size: SIZE_FLOAT, value };
  },

  toBuffer(value) {
    const result = Buffer.allocUnsafe(SIZE_FLOAT);
    result.writeFloatLE(value);
    return result;
  },
};

const SIZE_DOUBLE = 4;
const double = {
  staticSize: SIZE_DOUBLE,

  fromBuffer(buffer, offset) {
    const value = buffer.readDoubleLE(offset);
    return { size: SIZE_DOUBLE, value };
  },

  toBuffer(value) {
    const result = Buffer.allocUnsafe(SIZE_DOUBLE);
    result.writeDoubleLE(value);
    return result;
  },
};

module.exports = {
  uint16: uint(2),
  uint24: uint(3),
  uint32: uint(4),
  uint40: uint(5),
  uint48: uint(6),

  int16: int(2),
  int24: int(3),
  int32: int(4),
  int40: int(5),
  int48: int(6),

  float,
  double,
};
