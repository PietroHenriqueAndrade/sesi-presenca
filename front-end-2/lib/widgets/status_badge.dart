import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../models/presenca.dart';

/// Selo (badge) colorido para a situação da presença.
class StatusBadge extends StatelessWidget {
  final StatusPresenca status;

  const StatusBadge({super.key, required this.status});

  Color get _cor {
    switch (status) {
      case StatusPresenca.presente:
        return AppColors.success;
      case StatusPresenca.atrasado:
        return AppColors.warning;
      case StatusPresenca.justificado:
        return AppColors.success;
      case StatusPresenca.saidaAntecipada:
        return AppColors.primary;
      case StatusPresenca.ausente:
        return AppColors.error;
    }
  }

  Color get _fundo {
    switch (status) {
      case StatusPresenca.presente:
        return AppColors.successSoft;
      case StatusPresenca.atrasado:
        return AppColors.warningSoft;
      case StatusPresenca.justificado:
        return AppColors.successSoft;
      case StatusPresenca.saidaAntecipada:
        return AppColors.primarySoft;
      case StatusPresenca.ausente:
        return AppColors.errorSoft;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: _fundo,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: _cor,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
