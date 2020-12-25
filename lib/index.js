'use strict';

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

function fixedSizeBuffer(size) {
  return {
    staticSize: size,

    fromBuffer(buffer, offset, context) {
      const value = buffer.slice(offset, offset + size);
      return { size: value.length, value };
    },

    toBuffer(value) {
      // TODO: warn we are discarding a part of the value?
      return value.slice(0, size);
    },
  };
}

function buffer() {
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

const types = {
  byte,
  signedByte,
  fixedSizeBuffer,
  buffer,
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
