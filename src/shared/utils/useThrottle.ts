export function useThrottle<T extends(...args: any[]) => any>(
  fn: T,
  delay: number,
  immediate = false,
) {
  let cachedRes: ReturnType<typeof fn>
  let lastDate = Date.now()

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastDate >= delay) {
      lastDate = Date.now()
      cachedRes = fn(...args)
      return cachedRes
    } else {
      if (!cachedRes && immediate) {
        cachedRes = fn(...args)
      }
      return cachedRes
    }
  }
}
