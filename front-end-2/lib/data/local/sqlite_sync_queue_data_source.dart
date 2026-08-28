import '../../core/errors/app_exception.dart';
import '../../models/sync_queue_item.dart';
import 'local_database.dart';
import 'sync_queue_data_source.dart';

class SqliteSyncQueueDataSource implements SyncQueueDataSource {
  SqliteSyncQueueDataSource({LocalDatabase? database})
    : _database = database ?? LocalDatabase.instance;

  final LocalDatabase _database;

  @override
  Future<void> enqueue(SyncQueueItem item) async {
    try {
      final db = await _database.database;
      await db.insert('sync_queue', item.toMap());
    } catch (error) {
      throw AppException(
        'Nao foi possivel salvar o registro offline.',
        type: AppExceptionType.localPersistence,
        cause: error,
      );
    }
  }

  @override
  Future<List<SyncQueueItem>> listPending() async {
    final db = await _database.database;
    final rows = await db.query(
      'sync_queue',
      where: 'status IN (?, ?)',
      whereArgs: [SyncQueueStatus.pending.name, SyncQueueStatus.error.name],
      orderBy: 'created_at ASC',
    );
    return rows.map(SyncQueueItem.fromMap).toList();
  }

  @override
  Future<List<SyncQueueItem>> listAll() async {
    final db = await _database.database;
    final rows = await db.query('sync_queue', orderBy: 'created_at DESC');
    return rows.map(SyncQueueItem.fromMap).toList();
  }

  @override
  Future<int> countPending() async {
    final db = await _database.database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) AS total FROM sync_queue WHERE status IN (?, ?)',
      [SyncQueueStatus.pending.name, SyncQueueStatus.error.name],
    );
    return (result.first['total'] as int?) ?? 0;
  }

  @override
  Future<DateTime?> lastSuccessfulSync() async {
    final db = await _database.database;
    final rows = await db.query(
      'sync_queue',
      columns: ['last_attempt_at'],
      where: 'status = ? AND last_attempt_at IS NOT NULL',
      whereArgs: [SyncQueueStatus.synced.name],
      orderBy: 'last_attempt_at DESC',
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final raw = rows.first['last_attempt_at'] as String?;
    return raw == null ? null : DateTime.parse(raw);
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
    if (localIds.isEmpty) return;

    final db = await _database.database;
    final now = DateTime.now().toIso8601String();
    final batch = db.batch();
    for (final localId in localIds) {
      if (status == SyncQueueStatus.error) {
        batch.rawUpdate(
          'UPDATE sync_queue SET status = ?, last_attempt_at = ?, error_message = ?, attempts = attempts + 1 WHERE local_id = ?',
          [status.name, now, errorMessage, localId],
        );
      } else {
        batch.update(
          'sync_queue',
          {
            'status': status.name,
            'last_attempt_at': now,
            'error_message': errorMessage,
          },
          where: 'local_id = ?',
          whereArgs: [localId],
        );
      }
    }
    await batch.commit(noResult: true);
  }
}
