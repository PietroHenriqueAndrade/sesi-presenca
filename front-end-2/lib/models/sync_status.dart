/// Estado de um item verificado na sincronização.
enum EstadoConexao { conectado, desconectado, verificando }

extension EstadoConexaoLabel on EstadoConexao {
  String get label {
    switch (this) {
      case EstadoConexao.conectado:
        return 'Conectado';
      case EstadoConexao.desconectado:
        return 'Desconectado';
      case EstadoConexao.verificando:
        return 'Verificando...';
    }
  }
}

/// Modelo de Status de Sincronização — resume o estado da comunicação
/// entre o tablet, o servidor e o banco local (SQLite).
class SyncStatus {
  final EstadoConexao internet;
  final EstadoConexao servidor;
  final EstadoConexao bancoLocal;
  final int registrosPendentes;
  final DateTime? ultimaSincronizacao;

  const SyncStatus({
    required this.internet,
    required this.servidor,
    required this.bancoLocal,
    required this.registrosPendentes,
    this.ultimaSincronizacao,
  });

  SyncStatus copyWith({
    EstadoConexao? internet,
    EstadoConexao? servidor,
    EstadoConexao? bancoLocal,
    int? registrosPendentes,
    DateTime? ultimaSincronizacao,
  }) => SyncStatus(
    internet: internet ?? this.internet,
    servidor: servidor ?? this.servidor,
    bancoLocal: bancoLocal ?? this.bancoLocal,
    registrosPendentes: registrosPendentes ?? this.registrosPendentes,
    ultimaSincronizacao: ultimaSincronizacao ?? this.ultimaSincronizacao,
  );
}
