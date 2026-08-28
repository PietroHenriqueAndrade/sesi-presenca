import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../core/network/api_client.dart';
import '../core/network/api_config.dart';
import '../core/session/session_manager.dart';

/// Fluxo legado de vinculação por uma única foto.
///
/// O cadastro biométrico principal do TCC acontece na WebView (3 fotos), mas
/// esta tela continua funcional para anexar uma foto de referência ao aluno no
/// Node sem depender da chave antiga `SharedPreferences['token']`.
class VincularController extends ChangeNotifier {
  VincularController({ApiClient? apiClient, SessionManager? sessionManager})
    : _apiClient = apiClient ?? ApiClient(),
      _sessionManager = sessionManager ?? SessionManager() {
    carregarAlunos();
  }

  final ApiClient _apiClient;
  final SessionManager _sessionManager;

  bool _processando = false;
  bool get processando => _processando;

  bool _carregandoAlunos = true;
  bool get carregandoAlunos => _carregandoAlunos;

  List<Map<String, dynamic>> _alunos = [];
  List<Map<String, dynamic>> get alunos => List.unmodifiable(_alunos);

  String? _alunoSelecionadoId;
  String? get alunoSelecionado => _alunoSelecionadoId;

  String? _erro;
  String? get erro => _erro;

  Future<void> carregarAlunos() async {
    _carregandoAlunos = true;
    _erro = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/alunos', query: {'limit': 100});
      final data = response['data'];
      final dados = data is Map ? data['dados'] : null;
      if (dados is! List) {
        throw const FormatException('Resposta de alunos fora do contrato esperado.');
      }

      _alunos = dados.whereType<Map>().map((item) {
        final map = Map<String, dynamic>.from(item);
        return {
          'id': map['id']?.toString() ?? '',
          'nome': map['nome']?.toString() ?? 'Aluno sem nome',
        };
      }).where((item) => (item['id'] as String).isNotEmpty).toList();
    } catch (e) {
      _alunos = [];
      _erro = 'Não foi possível carregar os alunos: $e';
      debugPrint(_erro);
    } finally {
      _carregandoAlunos = false;
      notifyListeners();
    }
  }

  void selecionarAluno(String? alunoId) {
    _alunoSelecionadoId = alunoId;
    notifyListeners();
  }

  Future<bool> vincularRostoNoPython(File foto, String alunoId) async {
    _processando = true;
    _erro = null;
    notifyListeners();

    try {
      final token = _sessionManager.state.accessToken;
      if (token == null || token.isEmpty) {
        _erro = 'Sessão expirada. Faça login novamente.';
        return false;
      }

      final request = http.MultipartRequest(
        'POST',
        ApiConfig.uri('/alunos/$alunoId/foto'),
      )
        ..headers['Authorization'] = 'Bearer $token'
        ..headers['Accept'] = 'application/json'
        ..files.add(await http.MultipartFile.fromPath('foto', foto.path));

      final streamed = await request.send().timeout(const Duration(seconds: 25));
      final responseBody = await streamed.stream.bytesToString();
      if (streamed.statusCode >= 200 && streamed.statusCode < 300) return true;

      try {
        final decoded = jsonDecode(responseBody);
        if (decoded is Map && decoded['message'] != null) {
          _erro = decoded['message'].toString();
        }
      } catch (_) {
        // Mantém mensagem genérica abaixo.
      }
      _erro ??= 'Servidor recusou a foto (HTTP ${streamed.statusCode}).';
      return false;
    } catch (e) {
      _erro = 'Erro ao enviar a foto: $e';
      debugPrint(_erro);
      return false;
    } finally {
      _processando = false;
      notifyListeners();
    }
  }
}
