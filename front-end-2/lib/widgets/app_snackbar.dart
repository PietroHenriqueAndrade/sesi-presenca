import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Snackbars padronizadas do aplicativo (sucesso, erro e informação).
class AppSnackbar {
  AppSnackbar._();

  static void _show(
    BuildContext context,
    String mensagem,
    Color cor,
    IconData icone,
  ) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: cor,
          content: Row(
            children: [
              Icon(icone, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  mensagem,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      );
  }

  static void sucesso(BuildContext context, String mensagem) =>
      _show(context, mensagem, AppColors.success, Icons.check_circle_outline);

  static void erro(BuildContext context, String mensagem) =>
      _show(context, mensagem, AppColors.error, Icons.error_outline);

  static void info(BuildContext context, String mensagem) =>
      _show(context, mensagem, AppColors.primary, Icons.info_outline);
}
