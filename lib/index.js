'use strict';

const arrayLikes = require('./array-like');
const bigEndian = require('./numbers-big-endian');
const littleEndian = require('./numbers-little-endian');

const NOT_STATIC = 0;

function struct(scheme) {
  const staticSize = Object.values(scheme).reduce((sum, type) => sum + type.staticSize, 0);
  const isStatic = Object.values(scheme).every((type) => type.staticSize !== NOT_STATIC);

  return {
    staticSize: isStatic ? staticSize : NOT_STATIC,

    fromBuffer(buffer, offset) {
      let result = {};
      let currentOffset = offset;
      let remainder = staticSize;

      for (let [name, type] of Object.entries(scheme)) {
        const { value, size } = type.fromBuffer(buffer, currentOffset, {
          reservedSize: remainder,
        });

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
        const part = type.toBuffer(value[name], { input: value });

        parts.push(part);
      }

      return Buffer.concat(parts);
    },
  };
}

const byte = {
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

const signedByte = {
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

function groupBits(scheme) {
  const bits = Object.values(scheme).reduce((sum, numBits) => sum + numBits, 0);
  const size = Math.ceil(bits / 8);

  return {
    staticSize: size,

    fromBuffer(buffer, offset) {
      let result = {};
      let currentBitPosition = 0;

      for (let [name, numBits] of Object.entries(scheme)) {
        const finalBitPosition = currentBitPosition + numBits;

        const startByte = Math.floor(currentBitPosition / 8);
        const endByte = Math.ceil(finalBitPosition / 8);

        const bitMask = (1 << numBits) - 1;
        const bitShift = endByte * 8 - finalBitPosition;

        const byteLength = endByte - startByte;
        const byteValue = buffer.readUIntBE(offset + startByte, byteLength);

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

const types = {
  byte,
  signedByte,
  bigEndian,
  littleEndian,
  ...arrayLikes,
  groupBits,
  struct,
};

function define(type) {
  return {
    fromBuffer(buffer) {
      const { value } = type.fromBuffer(buffer, 0);
      return value;
    },

    toBuffer(value) {
      return type.toBuffer(value);
    },
  };
}

module.exports = { define, types };
