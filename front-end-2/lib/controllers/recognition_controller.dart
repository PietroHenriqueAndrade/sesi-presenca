import 'dart:io'; // 👇 Import obrigatório para a variável File
import 'package:flutter/material.dart';

import '../models/aluno.dart';
import '../repositories/reconhecimento_repository.dart';

/// Estados possíveis da tela de reconhecimento facial.
enum EstadoReconhecimento { aguardando, processando, sucesso, erro }

/// Controller da tela de Reconhecimento Facial.
class RecognitionController extends ChangeNotifier {
  RecognitionController({ReconhecimentoRepository? repository})
    : _repository = repository ?? ReconhecimentoRepository();

  final ReconhecimentoRepository _repository;

  EstadoReconhecimento _estado = EstadoReconhecimento.aguardando;
  Aluno? _alunoReconhecido;
  DateTime? _horarioRegistro;

  EstadoReconhecimento get estado => _estado;
  Aluno? get alunoReconhecido => _alunoReconhecido;
  DateTime? get horarioRegistro => _horarioRegistro;
  bool get processando => _estado == EstadoReconhecimento.processando;

  // 👇 1. A MÁGICA: O método agora obriga a tela a enviar a foto tirada!
  Future<bool> simularReconhecimento(File foto) async {
    _estado = EstadoReconhecimento.processando;
    notifyListeners();

    try {
      // 👇 2. Repassando a foto de verdade para a IA
      _alunoReconhecido = await _repository.reconhecerAluno(foto);
      _horarioRegistro = DateTime.now();
      _estado = EstadoReconhecimento.sucesso;
      notifyListeners();
      return true;
    } catch (e) {
      // 👇 3. Capturando erros reais da API e do Node.js
      _estado = EstadoReconhecimento.erro;
      notifyListeners();
      return false;
    }
  }

  /// Reinicia o fluxo para uma nova tentativa.
  void reiniciar() {
    _estado = EstadoReconhecimento.aguardando;
    _alunoReconhecido = null;
    _horarioRegistro = null;
    notifyListeners();
  }
}