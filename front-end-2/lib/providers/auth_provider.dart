import 'package:flutter/material.dart';

import '../core/session/session_manager.dart';
import '../models/usuario.dart';
import '../repositories/auth_repository.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({AuthRepository? repository, SessionManager? sessionManager})
    : _repository = repository ?? AuthRepository(),
      _sessionManager = sessionManager ?? SessionManager(),
      _usuario = (sessionManager ?? SessionManager()).state.usuario;

  final AuthRepository _repository;
  final SessionManager _sessionManager;

  Usuario? _usuario;

  Usuario? get usuario => _usuario;
  bool get estaAutenticado =>
      _usuario != null && _sessionManager.state.isAuthenticated;

  Future<bool> restaurarSessao() async {
    _usuario = await _repository.restaurarSessao();
    notifyListeners();
    return estaAutenticado;
  }

  Future<void> login(String email, String senha) async {
    _usuario = await _repository.login(email, senha);
    notifyListeners();
  }

  Future<void> recuperarSenha(String email) =>
      _repository.recuperarSenha(email);

  Future<void> redefinirSenha({required String email, required String codigo, required String novaSenha}) =>
      _repository.redefinirSenha(email: email, codigo: codigo, novaSenha: novaSenha);

  Future<void> atualizarPerfil({
    required String nome,
    required String email,
  }) async {
    _usuario = await _repository.atualizarPerfil(nome: nome, email: email);
    notifyListeners();
  }

  Future<void> trocarSenha({
    required String senhaAtual,
    required String novaSenha,
  }) async {
    await _repository.trocarSenha(senhaAtual: senhaAtual, novaSenha: novaSenha);
    _usuario = null;
    notifyListeners();
  }

  Future<void> logout() async {
    await _repository.sair();
    _usuario = null;
    notifyListeners();
  }
}
