enum AppExceptionType {
  auth,
  validation,
  timeout,
  network,
  serverUnavailable,
  sessionExpired,
  localPersistence,
  invalidPayload,
  unexpected,
}

class AppException implements Exception {
  final String message;
  final AppExceptionType type;
  final Object? cause;

  const AppException(
    this.message, {
    this.type = AppExceptionType.unexpected,
    this.cause,
  });

  @override
  String toString() => 'AppException($type): $message';
}
