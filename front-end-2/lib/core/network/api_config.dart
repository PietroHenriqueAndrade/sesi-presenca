import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  static const bool apiIntegrationEnabled = bool.fromEnvironment(
    'API_INTEGRATION_ENABLED',
    defaultValue: true,
  );

  /// URL pública recomendada para produção.
  /// Ex.: --dart-define=TCC_SERVER_URL=https://presenca.exemplo.com.br
  static const String serverUrl = String.fromEnvironment(
    'TCC_SERVER_URL',
    defaultValue: '',
  );

  /// Opcional. Quando vazio e TCC_SERVER_URL existe, usa /face-api no mesmo domínio.
  static const String pythonUrl = String.fromEnvironment(
    'TCC_PYTHON_URL',
    defaultValue: '',
  );

  /// Compatibilidade com o laboratório/LAN existente.
  static const String ipServidor = String.fromEnvironment(
    'TCC_SERVER_IP',
    defaultValue: '127.0.0.1',
  );

  static const String serverScheme = String.fromEnvironment(
    'TCC_SERVER_SCHEME',
    defaultValue: 'http',
  );

  static const int nodePort = int.fromEnvironment(
    'TCC_NODE_PORT',
    defaultValue: 3000,
  );

  static const int pythonPort = int.fromEnvironment(
    'TCC_PYTHON_PORT',
    defaultValue: 5000,
  );

  /// Somente para teste release em LAN sem TLS. Nunca usar no APK de produção.
  static const bool allowInsecureHttp = bool.fromEnvironment(
    'TCC_ALLOW_INSECURE_HTTP',
    defaultValue: false,
  );

  static const String terminalTurmaId = String.fromEnvironment(
    'TCC_TURMA_ID',
    defaultValue: '',
  );

  static const String apiPrefix = '/api/v1';

  static String _trimSlash(String value) => value.trim().replaceFirst(RegExp(r'/+$'), '');

  static bool _isLoopback(Uri uri) =>
      uri.host == 'localhost' || uri.host == '127.0.0.1' || uri.host == '::1';

  static String _validarUrl(String value, String nome) {
    final normalizada = _trimSlash(value);
    final uri = Uri.tryParse(normalizada);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw StateError('$nome inválida: configure uma URL completa.');
    }

    if (kReleaseMode && uri.scheme != 'https' && !_isLoopback(uri) && !allowInsecureHttp) {
      throw StateError(
        '$nome precisa usar HTTPS no APK release. '
        'Para teste temporário em LAN use TCC_ALLOW_INSECURE_HTTP=true.',
      );
    }
    return normalizada;
  }

  static String get nodeBaseUrl {
    if (serverUrl.trim().isNotEmpty) return _validarUrl(serverUrl, 'TCC_SERVER_URL');
    return _validarUrl('$serverScheme://$ipServidor:$nodePort', 'Servidor Node');
  }

  static String get pythonBaseUrl {
    if (pythonUrl.trim().isNotEmpty) return _validarUrl(pythonUrl, 'TCC_PYTHON_URL');
    if (serverUrl.trim().isNotEmpty) return '$nodeBaseUrl/face-api';
    return _validarUrl('$serverScheme://$ipServidor:$pythonPort', 'Servidor Python');
  }

  static String get nodeApiBaseUrl => '$nodeBaseUrl$apiPrefix';

  static Uri uri(String endpoint, [Map<String, dynamic>? query]) {
    final normalized = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final base = Uri.parse('$nodeApiBaseUrl$normalized');
    if (query == null || query.isEmpty) return base;
    return base.replace(
      queryParameters: query.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    );
  }

  static Uri pythonUri(String endpoint, [Map<String, dynamic>? query]) {
    final normalized = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final base = Uri.parse('$pythonBaseUrl$normalized');
    if (query == null || query.isEmpty) return base;
    return base.replace(
      queryParameters: query.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    );
  }
}
