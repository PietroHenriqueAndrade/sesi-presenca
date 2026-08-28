import 'package:flutter/material.dart';

import '../repositories/dashboard_repository.dart';

/// Controller da tela de Dashboard.
class DashboardController extends ChangeNotifier {
  DashboardController({DashboardRepository? repository})
    : _repository = repository ?? DashboardRepository();

  final DashboardRepository _repository;

  bool _carregando = true;
  ResumoDashboard? _resumo;
  String? _erro;

  bool get carregando => _carregando;
  ResumoDashboard? get resumo => _resumo;
  String? get erro => _erro;

  Future<void> carregar() async {
    _carregando = true;
    _erro = null;
    notifyListeners();

    try {
      _resumo = await _repository.buscarResumo();
    } catch (error) {
      _erro = 'Não foi possível carregar o Dashboard. Verifique sua sessão e a conexão com a API.';
    } finally {
      _carregando = false;
      notifyListeners();
    }
  }
}
