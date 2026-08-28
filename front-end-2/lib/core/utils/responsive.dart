import 'package:flutter/material.dart';

import '../constants/app_constants.dart';

/// Utilitários de responsividade — o app foi pensado para tablets Android,
/// mas se adapta também a smartphones.
class Responsive {
  Responsive._();

  /// Considera tablet quando o menor lado da tela é >= 600dp.
  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).shortestSide >= AppConstants.tabletBreakpoint;

  /// Padding horizontal padrão da página conforme o dispositivo.
  static EdgeInsets pagePadding(BuildContext context) => EdgeInsets.symmetric(
    horizontal: isTablet(context) ? 32 : 20,
    vertical: 16,
  );

  /// Limita a largura do conteúdo em telas grandes para manter a leitura
  /// confortável em tablets.
  static Widget constrained({required Widget child}) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: AppConstants.maxContentWidth),
      child: child,
    ),
  );
}
