import 'package:flutter/material.dart';

/// Identidade visual do terminal SESI: branco, vermelho institucional e
/// neutros de alto contraste para uso em recepção/tablet.
class AppColors {
  AppColors._();

  static const Color primary = Color(0xFFE30613);
  static const Color primaryDark = Color(0xFFB8000B);
  static const Color primaryLight = Color(0xFFFF3944);
  static const Color primarySoft = Color(0xFFFFEAEC);

  static const Color background = Color(0xFFF7F7F8);
  static const Color surface = Colors.white;
  static const Color border = Color(0xFFE6E6E9);

  static const Color textPrimary = Color(0xFF17171A);
  static const Color textSecondary = Color(0xFF68686F);
  static const Color gray = Color(0xFF74747C);
  static const Color grayLight = Color(0xFFA8A8AE);

  static const Color success = Color(0xFF16834A);
  static const Color successSoft = Color(0xFFE8F7EF);
  static const Color error = Color(0xFFC7222A);
  static const Color errorSoft = Color(0xFFFFE9EA);
  static const Color warning = Color(0xFFB66B00);
  static const Color warningSoft = Color(0xFFFFF4DC);

  // Mantidos para compatibilidade com widgets antigos que ficaram fora do
  // fluxo do terminal. O app principal opera sempre em tema claro SESI.
  static const Color darkBackground = Color(0xFF161616);
  static const Color darkSurface = Color(0xFF202024);
  static const Color darkBorder = Color(0xFF34343A);
  static const Color darkTextPrimary = Colors.white;
  static const Color darkTextSecondary = Color(0xFFC5C5CA);
}
