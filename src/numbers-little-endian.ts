'use strict';

// This file defines all Little Endian number parsers

import { DataType } from './data-type';

function uint(size: number): DataType<number> {
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

function int(size: number): DataType<number> {
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
export const float: DataType<number> = {
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

const SIZE_DOUBLE = 8;
export const double: DataType<number> = {
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

export const uint16 = uint(2);
export const uint24 = uint(3);
export const uint32 = uint(4);
export const uint40 = uint(5);
export const uint48 = uint(6);

export const int16 = int(2);
export const int24 = int(3);
export const int32 = int(4);
export const int40 = int(5);
export const int48 = int(6);
