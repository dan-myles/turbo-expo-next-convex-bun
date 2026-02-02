import { Data } from "effect"

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string
  cause?: unknown
}> {}

export class StorageError extends Data.TaggedError("StorageError")<{
  operation: string
  cause?: unknown
}> {}
