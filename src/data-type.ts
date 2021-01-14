export interface DataType<T> {
  staticSize: number;
  fromBuffer(buffer: Buffer, offset: number, context?: any): { size: number; value: T };
  toBuffer(data: T): Buffer;
}

export const NOT_STATIC = 0 as const;
