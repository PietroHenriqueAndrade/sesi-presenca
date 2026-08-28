import '../../models/turma.dart';

class TurmaDto {
  final String id;
  final String nome;
  final int anoLetivo;
  final String turno;

  const TurmaDto({
    required this.id,
    required this.nome,
    required this.anoLetivo,
    required this.turno,
  });

  factory TurmaDto.fromJson(Map<String, dynamic> json) => TurmaDto(
    id: json['id']?.toString() ?? '',
    nome: json['nome'] as String? ?? '',
    anoLetivo: json['anoLetivo'] as int? ?? DateTime.now().year,
    turno: json['turno'] as String? ?? 'MANHA',
  );

  Turma toDomain({int quantidadeAlunos = 0}) => Turma(
    id: id,
    nome: nome,
    serie: anoLetivo.toString(),
    turno: TurnoTurmaBackend.fromBackend(turno),
    sala: '',
    quantidadeAlunos: quantidadeAlunos,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'nome': nome,
    'anoLetivo': anoLetivo,
    'turno': turno,
  };
}
