import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../errors/app_exception.dart';
import '../session/session_manager.dart';
import '../session/session_state.dart';
import 'api_config.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({http.Client? httpClient, SessionManager? sessionManager})
    : _httpClient = httpClient ?? http.Client(), _sessionManager = sessionManager ?? SessionManager();

  final http.Client _httpClient;
  final SessionManager _sessionManager;
  static const _publicEndpoints = <String>{
    '/auth/login',
    '/auth/recuperar-senha',
    '/auth/redefinir-senha',
    '/auth/refresh',
    '/health',
  };

  Future<Map<String, dynamic>> get(String endpoint, {String? accessToken, Map<String, dynamic>? query}) => _send('GET', endpoint, accessToken: accessToken, query: query);
  Future<Map<String, dynamic>> post(String endpoint, {String? accessToken, Object? body}) => _send('POST', endpoint, accessToken: accessToken, body: body);
  Future<Map<String, dynamic>> patch(String endpoint, {String? accessToken, Object? body}) => _send('PATCH', endpoint, accessToken: accessToken, body: body);
  Future<Map<String, dynamic>> delete(String endpoint, {String? accessToken}) => _send('DELETE', endpoint, accessToken: accessToken);

  Future<Map<String, dynamic>> _send(String method, String endpoint, {String? accessToken, Map<String, dynamic>? query, Object? body, bool allowRefresh = true}) async {
    if (!ApiConfig.apiIntegrationEnabled) {
      throw const ApiException('Integração com API desativada nesta versão.', type: AppExceptionType.serverUnavailable);
    }

    final normalized = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final isPublic = _publicEndpoints.contains(normalized);

    if (!isPublic && accessToken == null && _sessionManager.state.isExpired && allowRefresh) {
      await _tentarRenovarSessao();
    }

    final token = accessToken ?? _sessionManager.state.accessToken;
    if (!isPublic && (token == null || token.isEmpty)) {
      throw const ApiException('Sessão não encontrada. Faça login novamente.', statusCode: 401, type: AppExceptionType.sessionExpired);
    }

    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    try {
      final uri = ApiConfig.uri(normalized, query);
      final requestBody = body == null ? null : jsonEncode(body);
      final response = await switch (method) {
        'GET' => _httpClient.get(uri, headers: headers),
        'POST' => _httpClient.post(uri, headers: headers, body: requestBody),
        'PATCH' => _httpClient.patch(uri, headers: headers, body: requestBody),
        'DELETE' => _httpClient.delete(uri, headers: headers),
        _ => throw const ApiException('Método HTTP não suportado.'),
      }.timeout(const Duration(seconds: 20));

      final decoded = _decodeResponse(response.body);
      if (response.statusCode == 401 && !isPublic && accessToken == null && allowRefresh) {
        final renovou = await _tentarRenovarSessao(silencioso: true);
        if (renovou) return await _send(method, normalized, query: query, body: body, allowRefresh: false);
      }
      if (response.statusCode >= 400) {
        if (response.statusCode == 401) await _sessionManager.clear();
        throw ApiException(
          decoded['message']?.toString() ?? decoded['detail']?.toString() ?? 'Erro retornado pelo servidor.',
          statusCode: response.statusCode,
          type: response.statusCode == 401 ? AppExceptionType.sessionExpired : response.statusCode >= 500 ? AppExceptionType.serverUnavailable : AppExceptionType.validation,
        );
      }
      return decoded;
    } on ApiException { rethrow; }
    on TimeoutException catch (error) { throw ApiException('Tempo limite de comunicação com o servidor.', type: AppExceptionType.timeout, cause: error); }
    on http.ClientException catch (error) { throw ApiException('Não foi possível conectar ao servidor.', type: AppExceptionType.network, cause: error); }
    on FormatException catch (error) { throw ApiException('Resposta inválida recebida do servidor.', type: AppExceptionType.invalidPayload, cause: error); }
  }

  Future<bool> _tentarRenovarSessao({bool silencioso = false}) async {
    final state = _sessionManager.state;
    final refresh = state.refreshToken;
    if (refresh == null || refresh.isEmpty || state.usuario == null) {
      if (!silencioso) await _sessionManager.clear();
      return false;
    }
    try {
      final response = await _httpClient.post(
        ApiConfig.uri('/auth/refresh'),
        headers: const {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refresh}),
      ).timeout(const Duration(seconds: 15));
      final json = _decodeResponse(response.body);
      if (response.statusCode >= 400) throw const ApiException('Refresh token inválido.');
      final data = json['data'];
      if (data is! Map) throw const FormatException('Resposta de refresh sem data.');
      final access = data['token']?.toString() ?? '';
      final novoRefresh = data['refreshToken']?.toString() ?? '';
      final expiresAt = DateTime.tryParse(data['expiresAt']?.toString() ?? '');
      if (access.isEmpty || novoRefresh.isEmpty) throw const FormatException('Tokens ausentes no refresh.');
      await _sessionManager.save(SessionState(usuario: state.usuario, accessToken: access, refreshToken: novoRefresh, expiresAt: expiresAt));
      return true;
    } catch (_) {
      await _sessionManager.clear();
      return false;
    }
  }

  Map<String, dynamic> _decodeResponse(String body) {
    if (body.trim().isEmpty) return <String, dynamic>{};
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is Map) return Map<String, dynamic>.from(decoded);
    throw const FormatException('A resposta da API não é um objeto JSON.');
  }
}
