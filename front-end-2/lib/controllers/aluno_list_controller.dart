import 'package:flutter/material.dart';

import '../models/aluno.dart';
import '../models/turma.dart';
import '../repositories/aluno_repository.dart';
import '../repositories/turma_repository.dart';

/// Controller da tela de listagem de Alunos.
class AlunoListController extends ChangeNotifier {
  AlunoListController({
    AlunoRepository? repository,
    TurmaRepository? turmaRepository,
  }) : _repository = repository ?? AlunoRepository(),
       _turmaRepository = turmaRepository ?? TurmaRepository();

  final AlunoRepository _repository;
  final TurmaRepository _turmaRepository;

  bool _carregando = true;
  bool _carregouUmaVez = false;
  List<Aluno> _alunos = [];
  List<Turma> turmasDisponiveis = [];
  String? _filtroTurma;
  String _busca = '';

  bool get carregando => _carregando && !_carregouUmaVez;
  List<Aluno> get alunos => _alunos;
  String? get filtroTurma => _filtroTurma;

  Future<void> carregar() async {
    _carregando = true;
    notifyListeners();

    turmasDisponiveis = await _turmaRepository.listar();
    _alunos = await _repository.listar(busca: _busca, turma: _filtroTurma);

    _carregando = false;
    _carregouUmaVez = true;
    notifyListeners();
  }

  void buscar(String termo) {
    _busca = termo;
    carregar();
  }

  void filtrarPorTurma(String? turma) {
    _filtroTurma = turma;
    carregar();
  }

  Future<void> remover(String id) async {
    await _repository.remover(id);
    await carregar();
  }
}
