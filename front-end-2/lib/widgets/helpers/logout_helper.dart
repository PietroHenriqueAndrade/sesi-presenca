import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_strings.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';
import '../app_dialog.dart';

/// Confirma a saída do usuário, encerra a sessão (fake) e volta para o
/// Login limpando a pilha de navegação.
///
/// Compartilhado entre o [AppDrawer] e a tela de Perfil para evitar
/// duplicar o mesmo fluxo em dois lugares.
Future<void> confirmarELogout(BuildContext context) async {
  final confirmou = await AppDialog.confirmar(
    context,
    titulo: AppStrings.sair,
    mensagem: 'Deseja realmente sair da sua conta?',
    textoConfirmar: AppStrings.sair,
  );
  if (!confirmou || !context.mounted) return;

  await context.read<AuthProvider>().logout();
  if (context.mounted) {
    Navigator.of(
      context,
    ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
  }
}
