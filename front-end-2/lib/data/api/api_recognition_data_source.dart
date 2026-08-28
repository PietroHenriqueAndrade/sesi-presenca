import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../../core/network/api_config.dart';
import '../../core/network/api_exception.dart';
import '../../core/session/session_manager.dart';
import '../../models/aluno.dart';

/// Data source legado da câmera nativa.
///
/// O fluxo principal do TCC usa a WebView biométrica, mas este cliente continua
/// funcional como fallback e respeita a mesma sessão JWT do aplicativo.
class ApiRecognitionDataSource {
  ApiRecognitionDataSource({SessionManager? sessionManager})
      : _sessionManager = sessionManager ?? SessionManager();

  final SessionManager _sessionManager;

  Future<Aluno> reconhecerAluno(File foto) async {
    final token = _sessionManager.state.accessToken;
    if (token == null || token.isEmpty) {
      throw const ApiException('Sessão expirada. Faça login novamente.');
    }

    try {
      final request = http.MultipartRequest(
        'POST',
        ApiConfig.pythonUri('/reconhecer'),
      )
        ..headers['Authorization'] = 'Bearer $token'
        ..files.add(await http.MultipartFile.fromPath('file', foto.path));

      final streamed = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamed);

      final dynamic decodedRaw = jsonDecode(response.body);
      if (decodedRaw is! Map) {
        throw const ApiException('Resposta inválida do serviço de reconhecimento.');
      }
      final decoded = Map<String, dynamic>.from(decodedRaw);

      if (response.statusCode >= 400 || decoded['status'] == 'erro') {
        throw ApiException(decoded['mensagem']?.toString() ?? 'Erro no servidor de IA.');
      }
      if (decoded['reconhecido'] == false) {
        throw ApiException(decoded['mensagem']?.toString() ?? 'Rosto não reconhecido.');
      }

      final backendRaw = decoded['backend'];
      if (backendRaw is! Map) {
        throw const ApiException('A IA não retornou a confirmação do backend.');
      }
      final dataRaw = backendRaw['data'];
      if (dataRaw is! Map || dataRaw['aluno'] is! Map) {
        throw const ApiException('Resposta do backend incompatível com o aplicativo.');
      }

      return Aluno.fromJson(Map<String, dynamic>.from(dataRaw['aluno'] as Map));
    } on ApiException {
      rethrow;
    } on FormatException {
      throw const ApiException('O serviço de IA retornou JSON inválido.');
    } on SocketException {
      throw const ApiException('Não foi possível conectar ao serviço de IA.');
    } catch (e) {
      throw ApiException('Falha ao reconhecer o aluno: ${e.toString()}');
    }
  }
}
