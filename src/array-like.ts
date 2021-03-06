'use strict';

// This file defines all ArrayLike parsers

import { DataType, NOT_STATIC } from './data-type';

export function fixedSizeBuffer(size: number): DataType<Buffer> {
  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      const value = buffer.slice(offset, offset + size);
      return { size: value.length, value };
    },

    toBuffer(data) {
      // TODO: warn we are discarding a part of the value?
      return data.slice(0, size);
    },
  };
}

export function buffer(): DataType<Buffer> {
  return {
    staticSize: NOT_STATIC,

    fromBuffer(buffer, offset, context) {
      const value = buffer.slice(offset, buffer.length - context.reservedSize);
      return { size: value.length, value };
    },

    toBuffer(data) {
      return data;
    },
  };
}

// ====================================================================

export function fixedSizeString(size: number, encoding: BufferEncoding = 'utf8'): DataType<string> {
  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      const value = buffer.toString(encoding, offset, offset + size);
      return { size, value };
    },

    toBuffer(data) {
      // TODO: warn we are discarding a part of the value?
      return Buffer.from(data, encoding).slice(0, size);
    },
  };
}

export function string(encoding: BufferEncoding = 'utf8'): DataType<string> {
  return {
    staticSize: NOT_STATIC,

    fromBuffer(buffer, offset, context) {
      const value = buffer.slice(offset, buffer.length - context.reservedSize);
      return { size: value.length, value: value.toString(encoding) };
    },

    toBuffer(data) {
      return Buffer.from(data, encoding);
    },
  };
}

// ====================================================================

export function array<T>(type: DataType<T>): DataType<Array<T>> {
  if (type.staticSize === NOT_STATIC) {
    throw new Error('Cannot create an "array" from a type whose size is not static.');
  }

  return {
    staticSize: NOT_STATIC,

    fromBuffer(buffer, offset, context) {
      let result: Array<T> = [];
      let currentOffset = offset;

      while (currentOffset + type.staticSize <= buffer.length - context.reservedSize) {
        const { value, size } = type.fromBuffer(buffer, currentOffset, {
          reservedSize: 0, // TODO: reading reservedSize is not supported in array
        });

        result.push(value);
        currentOffset += size;
      }

      return { size: currentOffset - offset, value: result };
    },

    toBuffer(data) {
      let parts: Array<Buffer> = [];

      for (const item of data) {
        const part = type.toBuffer(item);

        parts.push(part);
      }

      return Buffer.concat(parts);
    },
  };
}

module.exports = {
  fixedSizeBuffer,
  buffer,
  fixedSizeString,
  string,
  array,
};
