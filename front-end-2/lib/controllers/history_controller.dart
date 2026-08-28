import 'package:flutter/material.dart';

import '../models/presenca.dart';
import '../repositories/presenca_repository.dart';

/// Controller da tela de Histórico.
///
/// Carrega os registros de presença e aplica filtros de busca (nome do aluno)
/// e de situação (chips de status).
class HistoryController extends ChangeNotifier {
  HistoryController({PresencaRepository? repository})
    : _repository = repository ?? PresencaRepository();

  final PresencaRepository _repository;

  bool _carregando = true;
  bool _carregouUmaVez = false;
  List<Presenca> _registros = [];
  StatusPresenca? _filtroStatus;
  String _busca = '';

  /// `true` apenas no carregamento inicial (tela vazia). Em atualizações
  /// via pull-to-refresh, a lista permanece visível e é o próprio
  /// [RefreshIndicator] que mostra o feedback de carregamento.
  bool get carregando => _carregando && !_carregouUmaVez;
  StatusPresenca? get filtroStatus => _filtroStatus;

  List<Presenca> get registros {
    Iterable<Presenca> lista = _registros;
    if (_filtroStatus != null) {
      lista = lista.where((p) => p.status == _filtroStatus);
    }
    if (_busca.isNotEmpty) {
      final termo = _busca.toLowerCase();
      lista = lista.where(
        (p) =>
            p.aluno.nome.toLowerCase().contains(termo) ||
            p.aluno.ra.contains(termo),
      );
    }
    return lista.toList();
  }

  Future<void> carregar() async {
    _carregando = true;
    notifyListeners();
    _registros = await _repository.buscarHistorico();
    _carregando = false;
    _carregouUmaVez = true;
    notifyListeners();
  }

  void filtrarPorStatus(StatusPresenca? status) {
    _filtroStatus = status;
    notifyListeners();
  }

  void buscar(String termo) {
    _busca = termo;
    notifyListeners();
  }
}
