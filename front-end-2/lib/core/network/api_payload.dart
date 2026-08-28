import '../errors/app_exception.dart';
import 'api_exception.dart';

/// Normaliza os dois formatos de lista usados pela API:
/// 1) { data: [...] }
/// 2) { data: { dados: [...], meta: {...} } }
class ApiPayload {
  ApiPayload._();

  static List<dynamic> list(Map<String, dynamic> response) {
    final data = response['data'];

    if (data is List) return data;

    if (data is Map) {
      final dados = data['dados'];
      if (dados is List) return dados;
    }

    throw const ApiException(
      'Formato de lista inesperado recebido do servidor.',
      type: AppExceptionType.invalidPayload,
    );
  }

  static Map<String, dynamic> object(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);

    throw const ApiException(
      'Formato de objeto inesperado recebido do servidor.',
      type: AppExceptionType.invalidPayload,
    );
  }
}
