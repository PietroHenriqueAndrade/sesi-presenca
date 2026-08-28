import '../../models/sync_queue_item.dart';

abstract class SyncQueueDataSource {
  Future<void> enqueue(SyncQueueItem item);
  Future<List<SyncQueueItem>> listPending();
  Future<List<SyncQueueItem>> listAll();
  Future<int> countPending();
  Future<DateTime?> lastSuccessfulSync();
  Future<void> markSyncing(List<String> localIds);
  Future<void> markSynced(List<String> localIds);
  Future<void> markError(List<String> localIds, String message);
}
