import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../controllers/login_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => LoginController(authProvider: context.read<AuthProvider>()),
      child: const _LoginView(),
    );
  }
}

class _LoginView extends StatelessWidget {
  const _LoginView();

  Future<void> _entrar(BuildContext context) async {
    final controller = context.read<LoginController>();
    if (!await controller.entrar() || !context.mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil(AppRoutes.reconhecimento, (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<LoginController>();
    final width = MediaQuery.sizeOf(context).width;
    final tablet = width >= 700;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: tablet ? 48 : 22, vertical: 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Form(
                key: controller.formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(child: Image.asset('assets/branding/sesi-logo.png', width: tablet ? 250 : 205)),
                    const SizedBox(height: 34),
                    const Text(
                      'Terminal de Presença',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: -0.7),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Entre com uma conta autorizada para iniciar o reconhecimento facial.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 15, height: 1.45),
                    ),
                    const SizedBox(height: 34),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.border),
                        boxShadow: const [
                          BoxShadow(color: Color(0x12000000), blurRadius: 35, offset: Offset(0, 14)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            controller: controller.emailController,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.username, AutofillHints.email],
                            validator: controller.validarEmail,
                            decoration: const InputDecoration(
                              labelText: 'E-mail',
                              prefixIcon: Icon(Icons.alternate_email_rounded),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: controller.senhaController,
                            obscureText: !controller.senhaVisivel,
                            autofillHints: const [AutofillHints.password],
                            validator: controller.validarSenha,
                            onFieldSubmitted: (_) => controller.carregando ? null : _entrar(context),
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              prefixIcon: const Icon(Icons.lock_outline_rounded),
                              suffixIcon: IconButton(
                                onPressed: controller.alternarVisibilidadeSenha,
                                icon: Icon(controller.senhaVisivel ? Icons.visibility_off_rounded : Icons.visibility_rounded),
                              ),
                            ),
                          ),
                          if (controller.erro != null) ...[
                            const SizedBox(height: 14),
                            Container(
                              padding: const EdgeInsets.all(13),
                              decoration: BoxDecoration(
                                color: AppColors.errorSoft,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Text(controller.erro!, style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.w700)),
                            ),
                          ],
                          const SizedBox(height: 20),
                          FilledButton.icon(
                            onPressed: controller.carregando ? null : () => _entrar(context),
                            icon: controller.carregando
                                ? const SizedBox(width: 19, height: 19, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                                : const Icon(Icons.login_rounded),
                            label: Text(controller.carregando ? 'Entrando...' : 'Entrar e iniciar terminal'),
                          ),
                          const SizedBox(height: 10),
                          TextButton(
                            onPressed: controller.carregando ? null : () => Navigator.of(context).pushNamed(AppRoutes.esqueciSenha),
                            child: const Text('Esqueci minha senha'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shield_outlined, size: 17, color: AppColors.textSecondary),
                        SizedBox(width: 7),
                        Flexible(
                          child: Text(
                            'Acesso restrito • dados biométricos protegidos',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12.5, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
