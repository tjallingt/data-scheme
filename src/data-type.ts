type ReadContext = {
  reservedSize: number,
}

export type DataType<T> = {
  staticSize: number;
  fromBuffer(buffer: Buffer, offset: number, context: ReadContext): { size: number; value: T };
  toBuffer(data: T): Buffer;
}

export const NOT_STATIC = 0 as const;
