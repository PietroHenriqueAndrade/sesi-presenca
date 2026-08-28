enum TurnoTurma { manha, tarde, noite, integral }

extension TurnoTurmaLabel on TurnoTurma {
  String get label => switch (this) {
    TurnoTurma.manha => 'Manhã',
    TurnoTurma.tarde => 'Tarde',
    TurnoTurma.noite => 'Noite',
    TurnoTurma.integral => 'Integral',
  };
}

extension TurnoTurmaBackend on TurnoTurma {
  String get backendValue => switch (this) {
    TurnoTurma.manha => 'MANHA',
    TurnoTurma.tarde => 'TARDE',
    TurnoTurma.noite => 'NOITE',
    TurnoTurma.integral => 'INTEGRAL',
  };

  static TurnoTurma fromBackend(String? value) => switch (value?.toUpperCase()) {
    'TARDE' => TurnoTurma.tarde,
    'NOITE' => TurnoTurma.noite,
    'INTEGRAL' => TurnoTurma.integral,
    _ => TurnoTurma.manha,
  };
}

class Turma {
  final String id;
  final String nome;
  final String serie;
  final TurnoTurma turno;
  final String sala;
  final int quantidadeAlunos;

  const Turma({required this.id, required this.nome, required this.serie, required this.turno, required this.sala, this.quantidadeAlunos = 0});

  Turma copyWith({String? id, String? nome, String? serie, TurnoTurma? turno, String? sala, int? quantidadeAlunos}) => Turma(
    id: id ?? this.id, nome: nome ?? this.nome, serie: serie ?? this.serie, turno: turno ?? this.turno,
    sala: sala ?? this.sala, quantidadeAlunos: quantidadeAlunos ?? this.quantidadeAlunos,
  );

  factory Turma.fromJson(Map<String, dynamic> json) => Turma(
    id: json['id']?.toString() ?? '',
    nome: json['nome']?.toString() ?? '',
    serie: (json['serie'] ?? json['anoLetivo'])?.toString() ?? '',
    turno: TurnoTurmaBackend.fromBackend(json['turno']?.toString()),
    sala: json['sala']?.toString() ?? '',
    quantidadeAlunos: (json['quantidadeAlunos'] as num?)?.toInt() ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'nome': nome, 'anoLetivo': int.tryParse(serie), 'turno': turno.backendValue, 'sala': sala,
  };
}
