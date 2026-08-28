import '../../models/aluno.dart';

class AlunoDto {
  final String id;
  final String nome;
  final String matricula;
  final String? fotoTreinamento;

  const AlunoDto({
    required this.id,
    required this.nome,
    required this.matricula,
    this.fotoTreinamento,
  });

  factory AlunoDto.fromJson(Map<String, dynamic> json) => AlunoDto(
    id: json['id']?.toString() ?? '',
    nome: json['nome'] as String? ?? '',
    matricula: json['matricula'] as String? ?? '',
    fotoTreinamento: json['fotoTreinamento'] as String?,
  );

  Aluno toDomain({String turma = ''}) => Aluno(
    id: id,
    nome: nome,
    ra: matricula,
    turma: turma,
    fotoUrl: fotoTreinamento,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'nome': nome,
    'matricula': matricula,
    'fotoTreinamento': fotoTreinamento,
  };
}
