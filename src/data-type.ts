type ReadContext = {
  reservedSize: number,
}

export type DataType<T> = {
  staticSize: number;
  fromBuffer(buffer: Buffer, offset: number, context: ReadContext): { size: number; value: T };
  toBuffer(data: T): Buffer;
}

export const NOT_STATIC = 0 as const;

/**
 * Creates a union of all keys of a Type that include the IncludedType.
 */
type KeysIncludingType<Type, IncludedType> = {
  [Key in keyof Type]: IncludedType extends Type[Key] ? Key : never;
}[keyof Type];

/**
 * Transforms a type to make all properties that include the type undefined optional.
 */
export type FixOptional<Type> = Omit<Type, KeysIncludingType<Type, undefined>> &
  Partial<Pick<Type, KeysIncludingType<Type, undefined>>>;
