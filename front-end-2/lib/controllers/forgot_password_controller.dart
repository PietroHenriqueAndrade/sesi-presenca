import 'package:flutter/material.dart';
import '../providers/auth_provider.dart';
import '../repositories/auth_exception.dart';

class ForgotPasswordController extends ChangeNotifier {
  ForgotPasswordController({required this.authProvider});
  final AuthProvider authProvider;
  final emailController = TextEditingController();
  final codigoController = TextEditingController();
  final novaSenhaController = TextEditingController();
  final confirmarSenhaController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  bool _carregando = false;
  bool _codigoEnviado = false;
  bool _concluido = false;
  String? _erro;
  bool get carregando => _carregando;
  bool get codigoEnviado => _codigoEnviado;
  bool get concluido => _concluido;
  String? get erro => _erro;

  String? validarEmail(String? v) => v == null || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim()) ? 'E-mail inválido' : null;
  String? validarCodigo(String? v) => v == null || !RegExp(r'^\d{6}$').hasMatch(v.trim()) ? 'Informe o código de 6 dígitos' : null;
  String? validarNovaSenha(String? v) => v == null || v.length < 8 ? 'Use pelo menos 8 caracteres' : null;
  String? validarConfirmacao(String? v) => v != novaSenhaController.text ? 'As senhas não coincidem' : null;

  Future<void> enviarCodigo() async {
    if (!(formKey.currentState?.validate() ?? false)) return;
    await _executar(() async { await authProvider.recuperarSenha(emailController.text.trim()); _codigoEnviado = true; });
  }

  Future<void> redefinir() async {
    if (!(formKey.currentState?.validate() ?? false)) return;
    await _executar(() async {
      await authProvider.redefinirSenha(email: emailController.text.trim(), codigo: codigoController.text.trim(), novaSenha: novaSenhaController.text);
      _concluido = true;
    });
  }

  Future<void> _executar(Future<void> Function() acao) async {
    _carregando = true; _erro = null; notifyListeners();
    try { await acao(); }
    on AuthException catch (e) { _erro = e.mensagem; }
    catch (_) { _erro = 'Não foi possível concluir a solicitação.'; }
    finally { _carregando = false; notifyListeners(); }
  }

  @override
  void dispose() {
    emailController.dispose(); codigoController.dispose(); novaSenhaController.dispose(); confirmarSenhaController.dispose(); super.dispose();
  }
}
