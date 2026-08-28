import 'package:flutter/material.dart';

import '../models/disciplina.dart';
import '../repositories/disciplina_repository.dart';

/// Controller do formulário de cadastro/edição de Disciplina.
class DisciplinaFormController extends ChangeNotifier {
  DisciplinaFormController({
    Disciplina? disciplinaParaEditar,
    DisciplinaRepository? repository,
  }) : _disciplinaOriginal = disciplinaParaEditar,
       _repository = repository ?? DisciplinaRepository() {
    if (disciplinaParaEditar != null) {
      nomeController.text = disciplinaParaEditar.nome;
      professorController.text = disciplinaParaEditar.professor;
      cargaHorariaController.text = disciplinaParaEditar.cargaHoraria
          .toString();
    }
  }

  final Disciplina? _disciplinaOriginal;
  final DisciplinaRepository _repository;

  final formKey = GlobalKey<FormState>();
  final nomeController = TextEditingController();
  final professorController = TextEditingController();
  final cargaHorariaController = TextEditingController();

  bool get emEdicao => _disciplinaOriginal != null;

  bool _salvando = false;
  bool get salvando => _salvando;

  String? validarObrigatorio(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Campo obrigatório';
    return null;
  }

  String? validarCargaHoraria(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Campo obrigatório';
    final numero = int.tryParse(valor.trim());
    if (numero == null || numero <= 0) return 'Informe um número válido';
    return null;
  }

  Future<bool> salvar() async {
    if (!(formKey.currentState?.validate() ?? false)) return false;

    _salvando = true;
    notifyListeners();
    try {
      final cargaHoraria = int.parse(cargaHorariaController.text.trim());
      if (emEdicao) {
        await _repository.atualizar(
          _disciplinaOriginal!.copyWith(
            nome: nomeController.text.trim(),
            professor: professorController.text.trim(),
            cargaHoraria: cargaHoraria,
          ),
        );
      } else {
        await _repository.criar(
          nome: nomeController.text.trim(),
          professor: professorController.text.trim(),
          cargaHoraria: cargaHoraria,
        );
      }
      return true;
    } finally {
      _salvando = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    nomeController.dispose();
    professorController.dispose();
    cargaHorariaController.dispose();
    super.dispose();
  }
}
