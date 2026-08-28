import 'package:flutter/material.dart';

import '../providers/auth_provider.dart';
import '../repositories/auth_exception.dart';

/// Controller da tela de Login — valida o formulário e delega a
/// autenticação ao [AuthProvider] global.
class LoginController extends ChangeNotifier {
  LoginController({required this.authProvider});

  final AuthProvider authProvider;

  final TextEditingController emailController = TextEditingController();
  final TextEditingController senhaController = TextEditingController();
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();

  bool _carregando = false;
  bool _senhaVisivel = false;
  String? _erro;

  bool get carregando => _carregando;
  bool get senhaVisivel => _senhaVisivel;
  String? get erro => _erro;

  void alternarVisibilidadeSenha() {
    _senhaVisivel = !_senhaVisivel;
    notifyListeners();
  }

  String? validarEmail(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Informe o e-mail';
    if (!valor.contains('@') || !valor.contains('.')) {
      return 'E-mail inválido';
    }
    return null;
  }

  String? validarSenha(String? valor) {
    if (valor == null || valor.isEmpty) return 'Informe a senha';
    if (valor.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    return null;
  }

  /// Retorna `true` quando o login foi bem-sucedido.
  Future<bool> entrar() async {
    if (!(formKey.currentState?.validate() ?? false)) return false;

    _carregando = true;
    _erro = null;
    notifyListeners();

    try {
      await authProvider.login(
        emailController.text.trim(),
        senhaController.text,
      );
      return true;
    } on AuthException catch (e) {
      _erro = e.mensagem;
      return false;
    } catch (_) {
      _erro = 'Não foi possível entrar. Tente novamente.';
      return false;
    } finally {
      _carregando = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    senhaController.dispose();
    super.dispose();
  }
}
