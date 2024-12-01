export type ReturnType<T> = Promise<{
  error: boolean;
  detail: T;
  status?: number;
}>;
