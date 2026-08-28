import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_face/data/local/memory_sync_queue_data_source.dart';
import 'package:tcc_face/models/sync_queue_item.dart';
import 'package:tcc_face/repositories/sync_repository.dart';

SyncQueueItem item(String id) => SyncQueueItem(
  localId: id,
  operation: 'registrar_presenca_facial',
  payload: {'alunoId': 'a1', 'turmaId': 't1'},
  createdAt: DateTime(2026, 8, 24, 7, 10),
);

void main() {
  test('fila offline contabiliza pendencias reais', () async {
    final queue = MemorySyncQueueDataSource();
    final repository = SyncRepository(queueDataSource: queue);
    await queue.enqueue(item('local-1'));

    final status = await repository.buscarStatus();

    expect(status.registrosPendentes, 1);
    expect((await repository.listarPendentes()).single.localId, 'local-1');
  });

  test('erro de sincronização permanece pendente e incrementa tentativas', () async {
    final queue = MemorySyncQueueDataSource();
    await queue.enqueue(item('local-1'));
    await queue.markError(['local-1'], 'Sem rede');

    final pendente = (await queue.listPending()).single;
    expect(pendente.status, SyncQueueStatus.error);
    expect(pendente.attempts, 1);
    expect(pendente.errorMessage, 'Sem rede');
  });

  test('registro sincronizado deixa de aparecer como pendente', () async {
    final queue = MemorySyncQueueDataSource();
    await queue.enqueue(item('local-1'));
    await queue.markSyncing(['local-1']);
    await queue.markSynced(['local-1']);

    expect(await queue.countPending(), 0);
    expect((await queue.listAll()).single.status, SyncQueueStatus.synced);
  });
}
