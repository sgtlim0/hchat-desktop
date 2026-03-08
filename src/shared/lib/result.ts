export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value
  }
  if (result.error instanceof Error) {
    throw result.error
  }
  throw new Error(`Result is Err: ${String(result.error)}`)
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return isOk(result) ? result.value : fallback
}

export function map<T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value))
  }
  return result as Result<U, E>
}

export function flatMap<T, U, E>(result: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value)
  }
  return result as Result<U, E>
}

export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)))
  }
}
