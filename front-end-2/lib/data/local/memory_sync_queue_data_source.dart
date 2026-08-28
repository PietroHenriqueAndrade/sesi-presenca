import '../../models/sync_queue_item.dart';
import 'sync_queue_data_source.dart';

class MemorySyncQueueDataSource implements SyncQueueDataSource {
  final List<SyncQueueItem> _items = [];

  @override
  Future<void> enqueue(SyncQueueItem item) async {
    _items.add(item);
  }

  @override
  Future<List<SyncQueueItem>> listPending() async => _items
      .where(
        (item) =>
            item.status == SyncQueueStatus.pending ||
            item.status == SyncQueueStatus.error,
      )
      .toList();

  @override
  Future<List<SyncQueueItem>> listAll() async => List.of(_items);

  @override
  Future<int> countPending() async => (await listPending()).length;

  @override
  Future<DateTime?> lastSuccessfulSync() async {
    final synced =
        _items
            .where(
              (item) =>
                  item.status == SyncQueueStatus.synced &&
                  item.lastAttemptAt != null,
            )
            .toList()
          ..sort((a, b) => b.lastAttemptAt!.compareTo(a.lastAttemptAt!));
    return synced.isEmpty ? null : synced.first.lastAttemptAt;
  }

  @override
  Future<void> markSyncing(List<String> localIds) =>
      _updateMany(localIds, SyncQueueStatus.syncing);

  @override
  Future<void> markSynced(List<String> localIds) =>
      _updateMany(localIds, SyncQueueStatus.synced);

  @override
  Future<void> markError(List<String> localIds, String message) =>
      _updateMany(localIds, SyncQueueStatus.error, errorMessage: message);

  Future<void> _updateMany(
    List<String> localIds,
    SyncQueueStatus status, {
    String? errorMessage,
  }) async {
    final now = DateTime.now();
    for (var i = 0; i < _items.length; i++) {
      if (!localIds.contains(_items[i].localId)) continue;
      _items[i] = _items[i].copyWith(
        status: status,
        attempts: status == SyncQueueStatus.error
            ? _items[i].attempts + 1
            : _items[i].attempts,
        lastAttemptAt: now,
        errorMessage: errorMessage,
      );
    }
  }
}
