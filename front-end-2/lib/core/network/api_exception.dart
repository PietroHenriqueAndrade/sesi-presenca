import '../errors/app_exception.dart';

class ApiException extends AppException {
  final int? statusCode;

  const ApiException(
    super.message, {
    this.statusCode,
    super.type = AppExceptionType.serverUnavailable,
    super.cause,
  });
}
