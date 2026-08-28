import 'package:flutter/material.dart';

/// Provider de idioma — seleção apenas visual nesta etapa.
///
/// A troca real dos textos será feita quando a internacionalização (i18n)
/// for implementada junto da integração com o backend.
class LocaleProvider extends ChangeNotifier {
  static const List<String> idiomasDisponiveis = [
    'Português (Brasil)',
    'English (US)',
  ];

  String _idioma = idiomasDisponiveis.first;

  String get idioma => _idioma;

  void selecionarIdioma(String novoIdioma) {
    _idioma = novoIdioma;
    notifyListeners();
  }
}
