export interface DataType<T> {
  staticSize: number;
  fromBuffer(buffer: Buffer, offset: number, context?: any): { size: number; value: T };
  toBuffer(value: T): Buffer;
}

export const NOT_STATIC = 0 as const;
