import 'dart:convert';

enum SyncQueueStatus { pending, syncing, synced, error }

extension SyncQueueStatusLabel on SyncQueueStatus {
  String get label {
    switch (this) {
      case SyncQueueStatus.pending:
        return 'Pendente';
      case SyncQueueStatus.syncing:
        return 'Sincronizando';
      case SyncQueueStatus.synced:
        return 'Sincronizado';
      case SyncQueueStatus.error:
        return 'Erro';
    }
  }
}

class SyncQueueItem {
  final String localId;
  final String operation;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final int attempts;
  final SyncQueueStatus status;
  final DateTime? lastAttemptAt;
  final String? errorMessage;

  const SyncQueueItem({
    required this.localId,
    required this.operation,
    required this.payload,
    required this.createdAt,
    this.attempts = 0,
    this.status = SyncQueueStatus.pending,
    this.lastAttemptAt,
    this.errorMessage,
  });

  SyncQueueItem copyWith({
    String? localId,
    String? operation,
    Map<String, dynamic>? payload,
    DateTime? createdAt,
    int? attempts,
    SyncQueueStatus? status,
    DateTime? lastAttemptAt,
    String? errorMessage,
  }) => SyncQueueItem(
    localId: localId ?? this.localId,
    operation: operation ?? this.operation,
    payload: payload ?? this.payload,
    createdAt: createdAt ?? this.createdAt,
    attempts: attempts ?? this.attempts,
    status: status ?? this.status,
    lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
    errorMessage: errorMessage ?? this.errorMessage,
  );

  factory SyncQueueItem.fromMap(Map<String, Object?> map) => SyncQueueItem(
    localId: map['local_id']! as String,
    operation: map['operation']! as String,
    payload: jsonDecode(map['payload_json']! as String) as Map<String, dynamic>,
    createdAt: DateTime.parse(map['created_at']! as String),
    attempts: map['attempts']! as int,
    status: SyncQueueStatus.values.byName(map['status']! as String),
    lastAttemptAt: map['last_attempt_at'] == null
        ? null
        : DateTime.parse(map['last_attempt_at']! as String),
    errorMessage: map['error_message'] as String?,
  );

  Map<String, Object?> toMap() => {
    'local_id': localId,
    'operation': operation,
    'payload_json': jsonEncode(payload),
    'created_at': createdAt.toIso8601String(),
    'attempts': attempts,
    'status': status.name,
    'last_attempt_at': lastAttemptAt?.toIso8601String(),
    'error_message': errorMessage,
  };
}
