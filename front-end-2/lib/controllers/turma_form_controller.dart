import 'package:flutter/material.dart';

import '../models/turma.dart';
import '../repositories/turma_repository.dart';

/// Controller do formulário de cadastro/edição de Turma.
class TurmaFormController extends ChangeNotifier {
  TurmaFormController({Turma? turmaParaEditar, TurmaRepository? repository})
    : _turmaOriginal = turmaParaEditar,
      _repository = repository ?? TurmaRepository() {
    if (turmaParaEditar != null) {
      nomeController.text = turmaParaEditar.nome;
      serieController.text = turmaParaEditar.serie;
      salaController.text = turmaParaEditar.sala;
      _turno = turmaParaEditar.turno;
    }
  }

  final Turma? _turmaOriginal;
  final TurmaRepository _repository;

  final formKey = GlobalKey<FormState>();
  final nomeController = TextEditingController();
  final serieController = TextEditingController();
  final salaController = TextEditingController();

  bool get emEdicao => _turmaOriginal != null;

  TurnoTurma _turno = TurnoTurma.manha;
  TurnoTurma get turno => _turno;

  bool _salvando = false;
  bool get salvando => _salvando;

  void selecionarTurno(TurnoTurma? turno) {
    if (turno == null) return;
    _turno = turno;
    notifyListeners();
  }

  String? validarObrigatorio(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Campo obrigatório';
    return null;
  }


  String? validarAnoLetivo(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Campo obrigatório';
    final ano = int.tryParse(valor.trim());
    if (ano == null) return 'Informe um ano válido';
    final anoAtual = DateTime.now().year;
    if (ano < 2024 || ano > anoAtual + 2) return 'Ano letivo fora do intervalo permitido';
    return null;
  }

  Future<bool> salvar() async {
    if (!(formKey.currentState?.validate() ?? false)) return false;

    _salvando = true;
    notifyListeners();
    try {
      if (emEdicao) {
        await _repository.atualizar(
          _turmaOriginal!.copyWith(
            nome: nomeController.text.trim(),
            serie: serieController.text.trim(),
            sala: salaController.text.trim(),
            turno: _turno,
          ),
        );
      } else {
        await _repository.criar(
          nome: nomeController.text.trim(),
          serie: serieController.text.trim(),
          sala: salaController.text.trim(),
          turno: _turno,
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
    serieController.dispose();
    salaController.dispose();
    super.dispose();
  }
}
