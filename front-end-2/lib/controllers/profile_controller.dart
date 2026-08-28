import 'package:flutter/material.dart';

import '../providers/auth_provider.dart';
import '../repositories/auth_exception.dart';

/// Controller da tela de Perfil — edição de dados e troca de senha.
class ProfileController extends ChangeNotifier {
  ProfileController({required AuthProvider authProvider})
    : _authProvider = authProvider {
    final usuario = authProvider.usuario;
    nomeController.text = usuario?.nome ?? '';
    emailController.text = usuario?.email ?? '';
  }

  final AuthProvider _authProvider;

  final formKey = GlobalKey<FormState>();
  final nomeController = TextEditingController();
  final emailController = TextEditingController();

  final formSenhaKey = GlobalKey<FormState>();
  final senhaAtualController = TextEditingController();
  final novaSenhaController = TextEditingController();

  bool _salvandoPerfil = false;
  bool _trocandoSenha = false;
  String? _erroSenha;

  bool get salvandoPerfil => _salvandoPerfil;
  bool get trocandoSenha => _trocandoSenha;
  String? get erroSenha => _erroSenha;

  String? validarObrigatorio(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Campo obrigatório';
    return null;
  }

  String? validarEmail(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Informe o e-mail';
    if (!valor.contains('@') || !valor.contains('.')) return 'E-mail inválido';
    return null;
  }

  Future<bool> salvarPerfil() async {
    if (!(formKey.currentState?.validate() ?? false)) return false;
    _salvandoPerfil = true;
    notifyListeners();
    try {
      await _authProvider.atualizarPerfil(
        nome: nomeController.text.trim(),
        email: emailController.text.trim(),
      );
      return true;
    } finally {
      _salvandoPerfil = false;
      notifyListeners();
    }
  }

  Future<bool> trocarSenha() async {
    if (!(formSenhaKey.currentState?.validate() ?? false)) return false;
    _trocandoSenha = true;
    _erroSenha = null;
    notifyListeners();
    try {
      await _authProvider.trocarSenha(
        senhaAtual: senhaAtualController.text,
        novaSenha: novaSenhaController.text,
      );
      senhaAtualController.clear();
      novaSenhaController.clear();
      return true;
    } on AuthException catch (e) {
      _erroSenha = e.mensagem;
      return false;
    } finally {
      _trocandoSenha = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    nomeController.dispose();
    emailController.dispose();
    senhaAtualController.dispose();
    novaSenhaController.dispose();
    super.dispose();
  }
}
