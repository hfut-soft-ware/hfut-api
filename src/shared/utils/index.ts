export const isObject = (val: unknown): val is object =>
  val !== null && typeof val === 'object'

export const isEmptyObject = (val: unknown): val is object =>
  isObject(val) && Object.keys(val).length === 0
