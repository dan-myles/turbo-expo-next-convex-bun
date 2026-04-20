import { Data } from "effect"

export class BadRequest extends Data.TaggedError("BadRequest")<{
  message?: string
}> {}

export class Unauthorized extends Data.TaggedError("Unauthorized")<{
  message?: string
}> {}

export class Forbidden extends Data.TaggedError("Forbidden")<{
  message?: string
}> {}

export class NotFound extends Data.TaggedError("NotFound")<{
  message?: string
}> {}

export class InternalServerError extends Data.TaggedError(
  "InternalServerError",
)<{
  message?: string
}> {}

export const errorToResponse = (error: unknown): Response => {
  if (error instanceof BadRequest) {
    return Response.json(
      { message: error.message || "Bad request" },
      { status: 400 },
    )
  }

  if (error instanceof Unauthorized) {
    return Response.json(
      { message: error.message || "Unauthorized" },
      { status: 401 },
    )
  }

  if (error instanceof Forbidden) {
    return Response.json(
      { message: error.message || "Forbidden" },
      { status: 403 },
    )
  }

  if (error instanceof NotFound) {
    return Response.json(
      { message: error.message || "Not found" },
      { status: 404 },
    )
  }

  if (error instanceof InternalServerError) {
    return Response.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    )
  }

  return Response.json({ message: "Internal server error" }, { status: 500 })
}
