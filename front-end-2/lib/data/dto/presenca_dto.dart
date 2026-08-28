import '../../models/aluno.dart';
import '../../models/presenca.dart';

class PresencaDto {
  final String id;
  final String alunoId;
  final String turmaId;
  final String? disciplinaId;
  final String status;
  final DateTime dataHora;
  final DateTime? dataHoraSaida;

  const PresencaDto({
    required this.id,
    required this.alunoId,
    required this.turmaId,
    required this.status,
    required this.dataHora,
    this.disciplinaId,
    this.dataHoraSaida,
  });

  factory PresencaDto.fromJson(Map<String, dynamic> json) => PresencaDto(
    id: json['id']?.toString() ?? '',
    alunoId: json['alunoId']?.toString() ?? '',
    turmaId: json['turmaId']?.toString() ?? '',
    disciplinaId: json['disciplinaId']?.toString(),
    status: json['status'] as String? ?? 'PRESENTE',
    dataHora: DateTime.parse(json['dataHora'] as String),
    dataHoraSaida: json['dataHoraSaida'] == null
        ? null
        : DateTime.parse(json['dataHoraSaida'] as String),
  );

  Presenca toDomain({Aluno? aluno}) => Presenca(
    id: id,
    aluno:
        aluno ??
        Aluno(id: alunoId, nome: 'Aluno $alunoId', ra: '', turma: turmaId),
    data: DateTime(dataHora.year, dataHora.month, dataHora.day),
    entrada: dataHora,
    saida: dataHoraSaida,
    status: StatusPresencaBackend.fromBackend(status),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'alunoId': alunoId,
    'turmaId': turmaId,
    'disciplinaId': disciplinaId,
    'status': status,
    'dataHora': dataHora.toIso8601String(),
    'dataHoraSaida': dataHoraSaida?.toIso8601String(),
  };
}
