import 'sqlite_sync_queue_data_source.dart';
import 'sync_queue_data_source.dart';

SyncQueueDataSource createDefaultSyncQueueDataSource() =>
    SqliteSyncQueueDataSource();
