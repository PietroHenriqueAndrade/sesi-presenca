import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Indicador de status com ponto colorido + rótulo.
///
/// Usado para exibir Online/Offline na Home e os estados de conexão na
/// tela de Sincronização.
class StatusIndicator extends StatelessWidget {
  final String label;
  final bool ativo;

  /// Quando `true`, exibe um pequeno spinner no lugar do ponto.
  final bool verificando;

  const StatusIndicator({
    super.key,
    required this.label,
    required this.ativo,
    this.verificando = false,
  });

  @override
  Widget build(BuildContext context) {
    final Color cor = verificando
        ? AppColors.warning
        : (ativo ? AppColors.success : AppColors.error);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (verificando)
          const SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        else
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: cor,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: cor.withValues(alpha: 0.4),
                  blurRadius: 6,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: cor,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}
