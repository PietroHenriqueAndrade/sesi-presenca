import 'sync_queue_data_source.dart';
import 'sync_queue_factory_stub.dart'
    if (dart.library.io) 'sync_queue_factory_io.dart'
    as sync_factory;

SyncQueueDataSource createDefaultSyncQueueDataSource() =>
    sync_factory.createDefaultSyncQueueDataSource();
