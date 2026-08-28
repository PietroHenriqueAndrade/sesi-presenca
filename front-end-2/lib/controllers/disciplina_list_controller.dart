import 'package:flutter/material.dart';

import '../models/disciplina.dart';
import '../repositories/disciplina_repository.dart';

/// Controller da tela de listagem de Disciplinas.
class DisciplinaListController extends ChangeNotifier {
  DisciplinaListController({DisciplinaRepository? repository})
    : _repository = repository ?? DisciplinaRepository();

  final DisciplinaRepository _repository;

  bool _carregando = true;
  bool _carregouUmaVez = false;
  List<Disciplina> _disciplinas = [];
  String _busca = '';

  bool get carregando => _carregando && !_carregouUmaVez;
  List<Disciplina> get disciplinas => _disciplinas;

  Future<void> carregar() async {
    _carregando = true;
    notifyListeners();
    _disciplinas = await _repository.listar(busca: _busca);
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
