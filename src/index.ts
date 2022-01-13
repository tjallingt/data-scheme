'use strict';

import { DataType, FixOptional, NOT_STATIC } from './data-type';
import * as arrayLikes from './array-like';
import * as bigEndian from './numbers-big-endian';
import * as littleEndian from './numbers-little-endian';

type Schema = Record<string, DataType<unknown>>;

type ResultObjectOf<T extends Schema> = FixOptional<{
  [P in keyof T]: T[P] extends DataType<infer R> ? R : never;
}>;

function struct<T extends Schema>(schema: T): DataType<ResultObjectOf<T>> {
  let staticSize = 0;
  let isStatic = true;
  for (const type of Object.values(schema)) {
    if (type.staticSize === NOT_STATIC) isStatic = false;
    staticSize += type.staticSize;
  }

  return {
    staticSize: isStatic ? staticSize : NOT_STATIC,

    fromBuffer(buffer: Buffer, offset: number) {
      let result = {} as ResultObjectOf<T>;
      let currentOffset = offset;
      let remainder = staticSize;

      for (let [name, type] of Object.entries(schema)) {
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

    toBuffer(data) {
      let parts = [];

      for (let [name, type] of Object.entries(schema)) {
        // @ts-ignore we should be able to index into this type
        const current = data[name];
        const part = type.toBuffer(current);

        // TODO: handle optional/undefined

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

  toBuffer(data) {
    const result = Buffer.allocUnsafe(1);
    result.writeUInt8(data, 0);
    return result;
  },
};

const signedByte: DataType<number> = {
  staticSize: 1,

  fromBuffer(buffer, offset) {
    const value = buffer.readInt8(offset);
    return { size: 1, value };
  },

  toBuffer(data) {
    const result = Buffer.allocUnsafe(1);
    result.writeInt8(data, 0);
    return result;
  },
};

function groupBits<T extends Record<string, number>>(schema: T): DataType<T> {
  const bits = Object.values(schema).reduce((sum, numBits) => sum + numBits, 0);
  const size = Math.ceil(bits / 8);

  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      let result = {} as T;
      let currentBitPosition = 0;

      for (let [name, numBits] of Object.entries(schema)) {
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

    toBuffer(data) {
      let result = Buffer.alloc(size);
      let currentBitPosition = 0;

      for (let [name, numBits] of Object.entries(schema)) {
        const finalBitPosition = currentBitPosition + numBits;

        const startByte = Math.floor(currentBitPosition / 8);
        const endByte = Math.ceil(finalBitPosition / 8);

        const bitMask = (1 << numBits) - 1;
        const bitShift = endByte * 8 - finalBitPosition;

        const byteLength = endByte - startByte;
        const byteValue = result.readUIntBE(startByte, byteLength);

        const byteResult = (data[name] & bitMask) << bitShift;

        result.writeUIntBE(byteValue | byteResult, startByte, byteLength);
        currentBitPosition = finalBitPosition;
      }

      return result;
    },
  };
}

function optional<T>(type: DataType<T>): DataType<T | undefined> {
  if (type.staticSize === NOT_STATIC) {
    throw new Error('Cannot create an "optional" from a type whose size is not static.');
  }

  return {
    staticSize: NOT_STATIC,

    fromBuffer(buffer, offset, context) {
      if (buffer.length >= offset + type.staticSize) {
        return type.fromBuffer(buffer, offset, context);
      }

      return { size: 0, value: undefined };
    },

    toBuffer(data) {
      if (data) {
        return type.toBuffer(data);
      }
      return Buffer.alloc(0);
    },
  };
}

const none: DataType<undefined> = {
  staticSize: 0,

  fromBuffer(buffer, offset, context) {
    return { size: 0, value: undefined };
  },

  toBuffer(data) {
    return Buffer.alloc(0);
  },
};

export const types = {
  byte,
  signedByte,
  bigEndian,
  littleEndian,
  ...arrayLikes,
  groupBits,
  optional,
  none,
  struct,
};

export function doublepass<One, Two, Result extends Two>(
  type: DataType<One>,
  createSecondType: (data: One) => DataType<Two>,
  mapOutput: (one: One, two: Two) => Result,
  mapInput: (input: Result) => One,
): DataType<Result> {
  return {
    staticSize: NOT_STATIC,

    fromBuffer(buffer, offset, context) {
      const result = type.fromBuffer(buffer, offset, context);
      const second = createSecondType(result.value);
      const secondOffset = offset + result.size;
      const secondResult = second.fromBuffer(buffer, secondOffset, context);
      return {
        size: result.size + secondResult.size,
        value: mapOutput(result.value, secondResult.value),
      };
    },

    toBuffer(data) {
      const input = mapInput(data);
      const second = createSecondType(input);
      return Buffer.concat([type.toBuffer(input), second.toBuffer(data)]);
    },
  };
}

export function define<T>(type: DataType<T>) {
  return {
    fromBuffer(buffer: Buffer): T {
      const { value } = type.fromBuffer(buffer, 0, {
        reservedSize: buffer.length,
      });
      return value;
    },

    toBuffer(data: T): Buffer {
      return type.toBuffer(data);
    },
  };
}
