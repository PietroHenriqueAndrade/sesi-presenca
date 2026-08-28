import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controllers/forgot_password_controller.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';

class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({super.key});
  @override
  Widget build(BuildContext context) => ChangeNotifierProvider(
    create: (context) => ForgotPasswordController(authProvider: context.read<AuthProvider>()),
    child: const _View(),
  );
}

class _View extends StatelessWidget {
  const _View();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<ForgotPasswordController>();
    return Scaffold(
      appBar: AppBar(title: const Text('Recuperar senha')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: c.concluido ? _Concluido(onVoltar: () => Navigator.pop(context)) : Form(
                key: c.formKey,
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  const Icon(Icons.lock_reset, size: 64),
                  const SizedBox(height: 20),
                  Text(c.codigoEnviado ? 'Digite o código recebido por e-mail e escolha uma nova senha.' : 'Informe seu e-mail para receber um código de recuperação de 6 dígitos.', textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  TextFormField(controller: c.emailController, enabled: !c.codigoEnviado, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'E-mail'), validator: c.validarEmail),
                  if (c.codigoEnviado) ...[
                    const SizedBox(height: 16),
                    TextFormField(controller: c.codigoController, keyboardType: TextInputType.number, maxLength: 6, decoration: const InputDecoration(labelText: 'Código'), validator: c.validarCodigo),
                    const SizedBox(height: 12),
                    TextFormField(controller: c.novaSenhaController, obscureText: true, decoration: const InputDecoration(labelText: 'Nova senha'), validator: c.validarNovaSenha),
                    const SizedBox(height: 12),
                    TextFormField(controller: c.confirmarSenhaController, obscureText: true, decoration: const InputDecoration(labelText: 'Confirmar nova senha'), validator: c.validarConfirmacao),
                  ],
                  if (c.erro != null) ...[const SizedBox(height: 12), Text(c.erro!, style: TextStyle(color: Theme.of(context).colorScheme.error))],
                  const SizedBox(height: 24),
                  AppButton(label: c.codigoEnviado ? 'Redefinir senha' : 'Enviar código', loading: c.carregando, onPressed: c.codigoEnviado ? c.redefinir : c.enviarCodigo),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Concluido extends StatelessWidget {
  const _Concluido({required this.onVoltar});
  final VoidCallback onVoltar;
  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.check_circle_outline, size: 72, color: Colors.green),
    const SizedBox(height: 16),
    const Text('Senha redefinida com sucesso.', textAlign: TextAlign.center),
    const SizedBox(height: 24),
    AppButton(label: 'Voltar ao login', onPressed: onVoltar),
  ]);
}
