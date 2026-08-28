import 'aluno.dart';

/// Situação do registro de presença.
enum StatusPresenca { presente, atrasado, justificado, saidaAntecipada, ausente }

extension StatusPresencaLabel on StatusPresenca {
  String get label {
    switch (this) {
      case StatusPresenca.presente:
        return 'Presente';
      case StatusPresenca.atrasado:
        return 'Atrasado';
      case StatusPresenca.justificado:
        return 'Justificado';
      case StatusPresenca.saidaAntecipada:
        return 'Saída antecipada';
      case StatusPresenca.ausente:
        return 'Ausente';
    }
  }
}

extension StatusPresencaBackend on StatusPresenca {
  String get backendValue {
    switch (this) {
      case StatusPresenca.presente:
        return 'PRESENTE';
      case StatusPresenca.atrasado:
        return 'ATRASO';
      case StatusPresenca.justificado:
        return 'JUSTIFICADO';
      case StatusPresenca.saidaAntecipada:
        return 'SAIDA_ANTECIPADA';
      case StatusPresenca.ausente:
        return 'AUSENTE';
    }
  }

  static StatusPresenca fromBackend(String? value) {
    switch (value) {
      case 'ATRASO':
      case 'atrasado':
        return StatusPresenca.atrasado;
      case 'JUSTIFICADO':
      case 'justificado':
        return StatusPresenca.justificado;
      case 'SAIDA_ANTECIPADA':
      case 'saidaAntecipada':
        return StatusPresenca.saidaAntecipada;
      case 'AUSENTE':
      case 'ausente':
        return StatusPresenca.ausente;
      default:
        return StatusPresenca.presente;
    }
  }
}

/// Modelo de Presença — registro de entrada/saída de um aluno.
class Presenca {
  final String id;
  final Aluno aluno;
  final DateTime data;
  final DateTime? entrada;
  final DateTime? saida;
  final StatusPresenca status;

  const Presenca({
    required this.id,
    required this.aluno,
    required this.data,
    required this.status,
    this.entrada,
    this.saida,
  });

  factory Presenca.fromJson(Map<String, dynamic> json) {
    final rawAluno = json['aluno'];
    final alunoJson = rawAluno is Map
        ? Map<String, dynamic>.from(rawAluno)
        : <String, dynamic>{};

    final rawTurma = json['turma'];
    if (rawTurma is Map && alunoJson['turma'] == null) {
      alunoJson['turma'] = Map<String, dynamic>.from(rawTurma);
    }

    DateTime parseData(dynamic valor) =>
        DateTime.tryParse(valor?.toString() ?? '') ?? DateTime.now();

    final dataHora = json['dataHora'] ?? json['entrada'] ?? json['data'];

    return Presenca(
      id: json['id']?.toString() ?? '',
      aluno: Aluno.fromJson(alunoJson),
      data: parseData(json['data'] ?? dataHora),
      entrada: dataHora == null ? null : parseData(dataHora),
      saida: (json['saida'] ?? json['dataHoraSaida']) == null
          ? null
          : parseData(json['saida'] ?? json['dataHoraSaida']),
      status: StatusPresencaBackend.fromBackend(json['status']?.toString()),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'aluno': aluno.toJson(),
    'data': data.toIso8601String(),
    'dataHora': entrada?.toIso8601String(),
    'dataHoraSaida': saida?.toIso8601String(),
    'status': status.backendValue,
  };
}
