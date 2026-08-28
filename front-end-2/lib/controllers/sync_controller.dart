import 'package:flutter/material.dart';

import '../models/sync_status.dart';
import '../repositories/sync_repository.dart';

class SyncController extends ChangeNotifier {
  SyncController({SyncRepository? repository})
    : _repository = repository ?? SyncRepository();

  final SyncRepository _repository;

  bool _carregando = true;
  bool _sincronizando = false;
  SyncStatus? _status;
  String? _mensagem;

  bool get carregando => _carregando;
  bool get sincronizando => _sincronizando;
  SyncStatus? get status => _status;
  String? get mensagem => _mensagem;

  Future<void> carregar() async {
    _carregando = true;
    _mensagem = null;
    notifyListeners();
    _status = await _repository.buscarStatus();
    _carregando = false;
    notifyListeners();
  }

  Future<bool> sincronizar() async {
    if (_status == null || _sincronizando) return false;

    _sincronizando = true;
    _mensagem = null;
    _status = _status!.copyWith(
      internet: EstadoConexao.verificando,
      servidor: EstadoConexao.verificando,
      bancoLocal: EstadoConexao.verificando,
    );
    notifyListeners();

    try {
      await _repository.sincronizar();
      _status = await _repository.buscarStatus();
      _mensagem = 'Fila local sincronizada.';
      return true;
    } on SyncUnavailableException catch (error) {
      _status = await _repository.buscarStatus();
      _mensagem = error.message;
      return false;
    } catch (_) {
      _status = await _repository.buscarStatus();
      _mensagem = 'Nao foi possivel concluir a sincronizacao local.';
      return false;
    } finally {
      _sincronizando = false;
      notifyListeners();
    }
  }
}
