'use strict';

import { DataType, NOT_STATIC } from './data-type';
import * as arrayLikes from './array-like';
import * as bigEndian from './numbers-big-endian';
import * as littleEndian from './numbers-little-endian';

type Scheme = Record<string, DataType<unknown>>;

type ResultObjectOf<T extends Scheme> = {
  [P in keyof T]: T[P] extends DataType<infer R> ? R : never;
};

function struct<T extends Scheme>(scheme: T): DataType<ResultObjectOf<T>> {
  const staticSize = Object.values(scheme).reduce((sum, type) => sum + type.staticSize, 0);
  const isStatic = Object.values(scheme).every((type) => type.staticSize !== NOT_STATIC);

  return {
    staticSize: isStatic ? staticSize : NOT_STATIC,

    fromBuffer(buffer: Buffer, offset: number) {
      let result: ResultObjectOf<T> = {} as any;
      let currentOffset = offset;
      let remainder = staticSize;

      for (let [name, type] of Object.entries(scheme)) {
        const { value, size } = type.fromBuffer(buffer, currentOffset, {
          reservedSize: remainder,
        });

        // @ts-ignore we are building the result, we promise to use the right keys
        result[name] = value;
        currentOffset += size;
        remainder -= type.staticSize;
      }

      return { size: currentOffset - offset, value: result };
    },

    toBuffer(value) {
      let parts = [];

      for (let [name, type] of Object.entries(scheme)) {
        // TODO: handle optional/undefined
        const part = type.toBuffer(value[name]);

        parts.push(part);
      }

      return Buffer.concat(parts);
    },
  };
}

const byte: DataType<number> = {
  staticSize: 1,

  fromBuffer(buffer, offset) {
    const value = buffer.readUInt8(offset);
    return { size: 1, value };
  },

  toBuffer(value) {
    const result = Buffer.allocUnsafe(1);
    result.writeUInt8(value, 0);
    return result;
  },
};

const signedByte: DataType<number> = {
  staticSize: 1,

  fromBuffer(buffer, offset) {
    const value = buffer.readInt8(offset);
    return { size: 1, value };
  },

  toBuffer(value) {
    const result = Buffer.allocUnsafe(1);
    result.writeInt8(value, 0);
    return result;
  },
};

function groupBits<T extends Record<string, number>>(scheme: T): DataType<T> {
  const bits = Object.values(scheme).reduce((sum, numBits) => sum + numBits, 0);
  const size = Math.ceil(bits / 8);

  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      let result: T = {} as any;
      let currentBitPosition = 0;

      for (let [name, numBits] of Object.entries(scheme)) {
        const finalBitPosition = currentBitPosition + numBits;

        const startByte = Math.floor(currentBitPosition / 8);
        const endByte = Math.ceil(finalBitPosition / 8);

        const bitMask = (1 << numBits) - 1;
        const bitShift = endByte * 8 - finalBitPosition;

        const byteLength = endByte - startByte;
        const byteValue = buffer.readUIntBE(offset + startByte, byteLength);

        // @ts-ignore we are building the result, we promise to use the right keys
        result[name] = (byteValue >> bitShift) & bitMask;
        currentBitPosition = finalBitPosition;
      }

      return { size, value: result };
    },

    toBuffer(value) {
      let result = Buffer.alloc(size);
      let currentBitPosition = 0;

      for (let [name, numBits] of Object.entries(scheme)) {
        const finalBitPosition = currentBitPosition + numBits;

        const startByte = Math.floor(currentBitPosition / 8);
        const endByte = Math.ceil(finalBitPosition / 8);

        const bitMask = (1 << numBits) - 1;
        const bitShift = endByte * 8 - finalBitPosition;

        const byteLength = endByte - startByte;
        const byteValue = result.readUIntBE(startByte, byteLength);

        const byteResult = (value[name] & bitMask) << bitShift;

        result.writeUIntBE(byteValue | byteResult, startByte, byteLength);
        currentBitPosition = finalBitPosition;
      }

      return result;
    },
  };
}

export const types = {
  byte,
  signedByte,
  bigEndian,
  littleEndian,
  ...arrayLikes,
  groupBits,
  struct,
};

export function define<T>(type: DataType<T>) {
  return {
    fromBuffer(buffer: Buffer): T {
      const { value } = type.fromBuffer(buffer, 0);
      return value;
    },

    toBuffer(value: T): Buffer {
      return type.toBuffer(value);
    },
  };
}
