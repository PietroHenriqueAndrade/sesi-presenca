import '../core/errors/app_exception.dart';
import '../core/network/api_client.dart';
import '../core/network/api_config.dart';
import '../data/local/sync_queue_data_source.dart';
import '../data/local/sync_queue_factory.dart';
import '../models/sync_queue_item.dart';
import '../models/sync_status.dart';

class SyncUnavailableException extends AppException {
  const SyncUnavailableException([
    super.message = 'Não foi possível sincronizar com o servidor.',
  ]) : super(type: AppExceptionType.serverUnavailable);
}

class SyncRepository {
  SyncRepository({SyncQueueDataSource? queueDataSource, ApiClient? apiClient})
    : _queueDataSource = queueDataSource ?? createDefaultSyncQueueDataSource(),
      _apiClient = apiClient ?? ApiClient();

  final SyncQueueDataSource _queueDataSource;
  final ApiClient _apiClient;

  Future<SyncStatus> buscarStatus() async {
    final pending = await _queueDataSource.countPending();
    final lastSync = await _queueDataSource.lastSuccessfulSync();

    var servidor = EstadoConexao.desconectado;
    if (ApiConfig.apiIntegrationEnabled) {
      try {
        await _apiClient.get('/health');
        servidor = EstadoConexao.conectado;
      } catch (_) {
        servidor = EstadoConexao.desconectado;
      }
    }

    return SyncStatus(
      // No mobile, a capacidade útil aqui é alcançar o servidor da LAN.
      internet: servidor,
      servidor: servidor,
      bancoLocal: EstadoConexao.conectado,
      registrosPendentes: pending,
      ultimaSincronizacao: lastSync,
    );
  }

  Future<List<SyncQueueItem>> listarPendentes() =>
      _queueDataSource.listPending();

  Future<void> sincronizar() async {
    final pending = await _queueDataSource.listPending();
    if (pending.isEmpty) return;

    final ids = pending.map((item) => item.localId).toList();
    await _queueDataSource.markSyncing(ids);

    if (!ApiConfig.apiIntegrationEnabled) {
      await _queueDataSource.markError(ids, 'Integração com API desabilitada.');
      throw const SyncUnavailableException('Integração com API desabilitada.');
    }

    final lote = <Map<String, dynamic>>[];
    try {
      for (final item in pending) {
        final alunoId = item.payload['alunoId']?.toString();
        final turmaId = item.payload['turmaId']?.toString();
        final rawDataHora = item.payload['dataHora'] ?? item.payload['createdAt'];
        final dataHora =
            rawDataHora?.toString() ?? item.createdAt.toIso8601String();

        if (alunoId == null || alunoId.isEmpty || turmaId == null || turmaId.isEmpty) {
          throw const FormatException('Registro offline sem alunoId ou turmaId.');
        }
        lote.add({'alunoId': alunoId, 'turmaId': turmaId, 'dataHora': dataHora});
      }

      final response = await _apiClient.post(
        '/presencas/batch',
        body: {'lote': lote},
      );
      final resumo = response['resumo'] ??
          (response['data'] is Map ? (response['data'] as Map)['resumo'] : null);
      final falhas = resumo is Map
          ? (resumo['falha'] as num?)?.toInt() ?? 0
          : 0;

      if (falhas > 0) {
        await _queueDataSource.markError(
          ids,
          '$falhas registro(s) falharam no servidor.',
        );
        throw SyncUnavailableException(
          '$falhas registro(s) falharam no servidor.',
        );
      }
      await _queueDataSource.markSynced(ids);
    } catch (error) {
      if (error is! SyncUnavailableException) {
        await _queueDataSource.markError(ids, 'Falha ao sincronizar: $error');
      }
      if (error is SyncUnavailableException) rethrow;
      throw SyncUnavailableException('Falha ao sincronizar: $error');
    }
  }
}
