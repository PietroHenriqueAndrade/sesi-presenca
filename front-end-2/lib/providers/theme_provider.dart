import 'package:flutter/material.dart';

/// Provider de tema — alterna entre os modos claro e escuro.
class ThemeProvider extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.light;

  ThemeMode get mode => _mode;

  bool get isDark => _mode == ThemeMode.dark;

  void alternarTema(bool escuro) {
    _mode = escuro ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }
}
