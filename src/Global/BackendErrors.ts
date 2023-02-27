export enum GeneralErrors {
  METHOD_NOT_IMPLEMENTED = "METHOD_NOT_IMPLEMENTED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNHANDLED_ERROR = "UNHANDLED_ERROR",
  INVALID_REQUEST = "INVALID_REQUEST",
  INVALID_SERVICE = "INVALID_SERVICE",
  INVALID_SERVICE_TOKEN = "INVALID_SERVICE_TOKEN",
  INVALID_DEVICE = "INVALID_DEVICE",
  INVALID_ACCOUNT = "INVALID_ACCOUNT",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  SMS_SYSTEM_ERROR = "SMS_SYSTEM_ERROR",
  FIREBASE_SYSTEM_ERROR = "FIREBASE_SYSTEM_ERROR",
  PACKET_NOT_AUTHENTIC = "PACKET_NOT_AUTHENTIC",
  POWERSHELL_EXECUTION_ERROR = "POWERSHELL_EXECUTION_ERROR",
  DATABASE_REQUEST_ERROR = "DATABASE_REQUEST_ERROR",
  OBJECT_NOT_FOUND_IN_DATABASE = "OBJECT_NOT_FOUND_IN_DATABASE",
  USER_TOKEN_IS_MISSING = "USER_TOKEN_IS_MISSING",
  WEBSOCKET_NOT_AVAILABLE = "WEBSOCKET_NOT_AVAILABLE",
  TWO_FA_REQUEST_IDENTITY_ERROR = "TWO_FA_REQUEST_IDENTITY_ERROR",
  DEVICE_WRONG_CODE = "DEVICE_WRONG_CODE",
  ACCOUNT_EXPIRED_CODE = "ACCOUNT_EXPIRED_CODE",
  TWO_FA_REQUEST_ACTION_ERROR = "TWO_FA_REQUEST_ACTION_ERROR"
}

export enum AuthenticationErrors {
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_MUST_BE_LOGGED_OFF = "AUTH_MUST_BE_LOGGED_OFF",
  AUTH_NO_TOKEN_PROVIDED = "AUTH_NO_TOKEN_PROVIDED",
  AUTH_TOKEN_IS_NOT_AUTHENTIC = "AUTH_TOKEN_IS_NOT_AUTHENTIC",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_NO_ROLE_ALLOWED = "AUTH_NO_ROLE_ALLOWED",
  AUTH_USER_CLIENT_CONVERSION_FAILED = "AUTH_USER_CLIENT_CONVERSION_FAILED",
  AUTH_ACCESS_TO_INTRANET_NOT_ALLOWED = "AUTH_ACCESS_TO_INTRANET_NOT_ALLOWED",
  AUTH_DISABLED_ACCOUNT = "AUTH_DISABLED_ACCOUNT",
  AUTH_SWITCH_SITE_FAILED = "AUTH_SWITCH_SITE_FAILED",
  ACCESS_NOT_AUTHORIZED = "ACCESS_NOT_AUTHORIZED"
}
