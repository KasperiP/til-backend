export enum ApiError {
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  MISSING_BODY = 'MISSING_BODY',
  MISSING_CODE = 'MISSING_CODE',
  MISSING_PROVIDER = 'MISSING_PROVIDER',
  UNSUPPORTED_PROVIDER = 'UNSUPPORTED_PROVIDER',
  MISSING_ACCESS_TOKEN = 'MISSING_ACCESS_TOKEN',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  NOT_FOUND = 'NOT_FOUND',
  MISSING_SESSION_COOKIE = 'MISSING_SESSION_COOKIE',
  INVALID_SESSION_COOKIE = 'INVALID_SESSION_COOKIE',
  INVALID_REQUEST_BODY = 'INVALID_REQUEST_BODY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  POST_LIMIT_REACHED = 'POST_LIMIT_REACHED',
  CANNOT_LIKE_OWN_POST = 'CANNOT_LIKE_OWN_POST',
}
