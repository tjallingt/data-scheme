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

    toBuffer(value) {
      // TODO: warn we are discarding a part of the value?
      return value.slice(0, size);
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

    toBuffer(value) {
      return value;
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

    toBuffer(value) {
      // TODO: warn we are discarding a part of the value?
      return Buffer.from(value, encoding).slice(0, size);
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

    toBuffer(value) {
      return Buffer.from(value, encoding);
    },
  };
}

// ====================================================================

export function array<T>(type: DataType<T>): DataType<Array<T>> {
  if (type.staticSize === NOT_STATIC) {
    throw new Error('Cannot create an array out of elements whose sizes are not static.');
  }

  return {
    staticSize: NOT_STATIC,

    fromBuffer(buffer, offset, context) {
      let result = [];
      let currentOffset = offset;

      while (currentOffset + type.staticSize <= buffer.length - context.reservedSize) {
        const { value, size } = type.fromBuffer(buffer, currentOffset, {
          /** context */
        });

        result.push(value);
        currentOffset += size;
      }

      return { size: currentOffset - offset, value: result };
    },

    toBuffer(value) {
      let parts = [];

      for (const item of value) {
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
