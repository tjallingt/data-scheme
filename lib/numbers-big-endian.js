'use strict';

// This file defines all Big Endian number parsers

function uint(size) {
  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      const value = buffer.readUIntBE(offset, size);
      return { size, value };
    },

    toBuffer(value) {
      const result = Buffer.allocUnsafe(size);
      result.writeUIntBE(value, 0, size);
      return result;
    },
  };
}

function int(size) {
  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      const value = buffer.readIntBE(offset, size);
      return { size, value };
    },

    toBuffer(value) {
      const result = Buffer.allocUnsafe(size);
      result.writeIntBE(value, 0, size);
      return result;
    },
  };
}

const SIZE_FLOAT = 4;
const float = {
  staticSize: SIZE_FLOAT,

  fromBuffer(buffer, offset) {
    const value = buffer.readFloatBE(offset);
    return { size: SIZE_FLOAT, value };
  },

  toBuffer(value) {
    const result = Buffer.allocUnsafe(SIZE_FLOAT);
    result.writeFloatBE(value);
    return result;
  },
};

const SIZE_DOUBLE = 4;
const double = {
  staticSize: SIZE_DOUBLE,

  fromBuffer(buffer, offset) {
    const value = buffer.readDoubleBE(offset);
    return { size: SIZE_DOUBLE, value };
  },

  toBuffer(value) {
    const result = Buffer.allocUnsafe(SIZE_DOUBLE);
    result.writeDoubleBE(value);
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
