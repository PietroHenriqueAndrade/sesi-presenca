import 'package:flutter/material.dart';

import '../models/turma.dart';
import '../repositories/turma_repository.dart';

/// Controller da tela de listagem de Turmas.
class TurmaListController extends ChangeNotifier {
  TurmaListController({TurmaRepository? repository})
    : _repository = repository ?? TurmaRepository();

  final TurmaRepository _repository;

  bool _carregando = true;
  bool _carregouUmaVez = false;
  List<Turma> _turmas = [];
  String _busca = '';

  bool get carregando => _carregando && !_carregouUmaVez;
  List<Turma> get turmas => _turmas;

  Future<void> carregar() async {
    _carregando = true;
    notifyListeners();
    _turmas = await _repository.listar(busca: _busca);
    _carregando = false;
    _carregouUmaVez = true;
    notifyListeners();
  }

  void buscar(String termo) {
    _busca = termo;
    carregar();
  }

  Future<void> remover(String id) async {
    await _repository.remover(id);
    await carregar();
  }
}
