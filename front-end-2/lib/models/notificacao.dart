enum TipoNotificacao { info, alerta, sucesso }

class Notificacao {
  final String id;
  final String titulo;
  final String mensagem;
  final DateTime dataHora;
  final TipoNotificacao tipo;
  final bool lida;

  const Notificacao({
    required this.id,
    required this.titulo,
    required this.mensagem,
    required this.dataHora,
    required this.tipo,
    this.lida = false,
  });

  factory Notificacao.fromJson(Map<String, dynamic> json) {
    final rawTipo = json['tipo']?.toString();
    TipoNotificacao? tipo;
    for (final candidato in TipoNotificacao.values) {
      if (candidato.name == rawTipo) {
        tipo = candidato;
        break;
      }
    }
    final rawData = json['dataHora'] ?? json['criadoEm'];

    return Notificacao(
      id: json['id']?.toString() ?? '',
      titulo: json['titulo']?.toString() ?? 'Alerta de frequência',
      mensagem: json['mensagem']?.toString() ?? '',
      dataHora: rawData == null
          ? DateTime.now()
          : DateTime.tryParse(rawData.toString()) ?? DateTime.now(),
      tipo: tipo ?? TipoNotificacao.alerta,
      lida: json['lida'] as bool? ?? json['resolvido'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'titulo': titulo,
    'mensagem': mensagem,
    'dataHora': dataHora.toIso8601String(),
    'tipo': tipo.name,
    'lida': lida,
  };
}
