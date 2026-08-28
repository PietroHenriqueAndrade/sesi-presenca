import 'package:flutter/material.dart';

import '../models/presenca.dart';
import '../repositories/presenca_repository.dart';
import '../repositories/turma_repository.dart';

enum PeriodoRelatorio { ultimos7Dias, ultimos30Dias, todoPeriodo }

extension PeriodoRelatorioLabel on PeriodoRelatorio {
  String get label {
    switch (this) {
      case PeriodoRelatorio.ultimos7Dias:
        return 'Ultimos 7 dias';
      case PeriodoRelatorio.ultimos30Dias:
        return 'Ultimos 30 dias';
      case PeriodoRelatorio.todoPeriodo:
        return 'Todo o periodo';
    }
  }

  int? get dias {
    switch (this) {
      case PeriodoRelatorio.ultimos7Dias:
        return 7;
      case PeriodoRelatorio.ultimos30Dias:
        return 30;
      case PeriodoRelatorio.todoPeriodo:
        return null;
    }
  }
}

class RelatorioController extends ChangeNotifier {
  RelatorioController({
    TurmaRepository? turmaRepository,
    PresencaRepository? presencaRepository,
  }) : _turmaRepository = turmaRepository ?? TurmaRepository(),
       _presencaRepository = presencaRepository ?? PresencaRepository();

  final TurmaRepository _turmaRepository;
  final PresencaRepository _presencaRepository;

  bool _carregando = true;
  List<Presenca> _todosRegistros = [];
  List<Presenca> _registrosFiltrados = [];
  List<String> turmasDisponiveis = [];

  PeriodoRelatorio _periodo = PeriodoRelatorio.ultimos7Dias;
  String? _turma;
  StatusPresenca? _status;

  bool _exportando = false;

  bool get carregando => _carregando;
  bool get exportando => _exportando;
  List<Presenca> get registros => _registrosFiltrados;
  PeriodoRelatorio get periodo => _periodo;
  String? get turma => _turma;
  StatusPresenca? get status => _status;

  int get totalPresentes => _registrosFiltrados
      .where(
        (p) =>
            p.status == StatusPresenca.presente ||
            p.status == StatusPresenca.atrasado ||
            p.status == StatusPresenca.justificado ||
            p.status == StatusPresenca.saidaAntecipada,
      )
      .length;

  int get totalFaltas => _registrosFiltrados
      .where((p) => p.status == StatusPresenca.ausente)
      .length;

  double get percentualPresenca {
    if (_registrosFiltrados.isEmpty) return 0;
    return (totalPresentes / _registrosFiltrados.length) * 100;
  }

  List<int> get serieDiaria {
    final agora = DateTime.now();
    return List<int>.generate(7, (i) {
      final dia = agora.subtract(Duration(days: 6 - i));
      return _registrosFiltrados
          .where(
            (p) =>
                p.data.year == dia.year &&
                p.data.month == dia.month &&
                p.data.day == dia.day &&
                p.status != StatusPresenca.ausente,
          )
          .length;
    });
  }

  Future<void> carregar() async {
    _carregando = true;
    notifyListeners();

    turmasDisponiveis = await _turmaRepository.listarNomes();
    _todosRegistros = await _presencaRepository.buscarHistorico();
    _aplicarFiltros();

    _carregando = false;
    notifyListeners();
  }

  void filtrarPorPeriodo(PeriodoRelatorio periodo) {
    _periodo = periodo;
    _aplicarFiltros();
    notifyListeners();
  }

  void filtrarPorTurma(String? turma) {
    _turma = turma;
    _aplicarFiltros();
    notifyListeners();
  }

  void filtrarPorStatus(StatusPresenca? status) {
    _status = status;
    _aplicarFiltros();
    notifyListeners();
  }

  void _aplicarFiltros() {
    Iterable<Presenca> lista = _todosRegistros;

    final dias = _periodo.dias;
    if (dias != null) {
      final limite = DateTime.now().subtract(Duration(days: dias));
      lista = lista.where((p) => p.data.isAfter(limite));
    }
    if (_status != null) {
      lista = lista.where((p) => p.status == _status);
    }
    if (_turma != null && _turma!.isNotEmpty) {
      lista = lista.where((p) => p.aluno.turma == _turma);
    }
    _registrosFiltrados = lista.toList()
      ..sort((a, b) => b.data.compareTo(a.data));
  }

  Future<void> exportar() async {
    _exportando = true;
    notifyListeners();
    await Future<void>.delayed(const Duration(milliseconds: 900));
    _exportando = false;
    notifyListeners();
  }
}
