export async function tryToCatch<T>(
  fn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<[Error | null, T | null]> {
  try {
    const result = await fn(...args);
    return [null, result];
  } catch (error) {
    return [error as Error, null];
  }
}
