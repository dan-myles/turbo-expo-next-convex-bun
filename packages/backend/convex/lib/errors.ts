export enum DatabaseError {
  QUERY_FAILED = "QUERY_FAILED",
  INSERT_FAILED = "INSERT_FAILED",
  UPDATE_FAILED = "UPDATE_FAILED",
  DELETE_FAILED = "DELETE_FAILED",
  NOT_FOUND = "NOT_FOUND",
}

export const dbError = {
  queryFailed: () => DatabaseError.QUERY_FAILED,
  insertFailed: () => DatabaseError.INSERT_FAILED,
  updateFailed: () => DatabaseError.UPDATE_FAILED,
  deleteFailed: () => DatabaseError.DELETE_FAILED,
  notFound: () => DatabaseError.NOT_FOUND,
}
