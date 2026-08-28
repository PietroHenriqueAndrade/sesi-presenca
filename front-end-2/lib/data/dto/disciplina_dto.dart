import '../../models/disciplina.dart';

class DisciplinaDto {
  final String id;
  final String nome;
  final String codigo;

  const DisciplinaDto({
    required this.id,
    required this.nome,
    required this.codigo,
  });

  factory DisciplinaDto.fromJson(Map<String, dynamic> json) => DisciplinaDto(
    id: json['id']?.toString() ?? '',
    nome: json['nome'] as String? ?? '',
    codigo: json['codigo'] as String? ?? '',
  );

  Disciplina toDomain() =>
      Disciplina(id: id, nome: nome, professor: '', cargaHoraria: 0);

  Map<String, dynamic> toJson() => {'id': id, 'nome': nome, 'codigo': codigo};
}
