class Horario {
  final String disciplina;
  final String professor;
  final String sala;
  final int diaSemana;
  final String horaInicio;
  final String horaFim;

  const Horario({
    required this.disciplina,
    required this.professor,
    required this.sala,
    required this.diaSemana,
    required this.horaInicio,
    required this.horaFim,
  });

  static int _diaSemana(dynamic valor) {
    if (valor is int) return valor;
    const mapa = {
      'SEGUNDA': 1,
      'TERCA': 2,
      'QUARTA': 3,
      'QUINTA': 4,
      'SEXTA': 5,
      'SABADO': 6,
      'DOMINGO': 7,
    };
    return mapa[valor?.toString().toUpperCase()] ?? 1;
  }

  factory Horario.fromJson(Map<String, dynamic> json) {
    final disciplinaJson = json['disciplina'];
    final turmaJson = json['turma'];

    return Horario(
      disciplina: disciplinaJson is Map
          ? disciplinaJson['nome']?.toString() ?? ''
          : disciplinaJson?.toString() ?? '',
      professor: disciplinaJson is Map
          ? disciplinaJson['professor']?.toString() ?? 'Professor não informado'
          : json['professor']?.toString() ?? 'Professor não informado',
      sala: turmaJson is Map
          ? turmaJson['sala']?.toString() ?? 'Sala não informada'
          : json['sala']?.toString() ?? 'Sala não informada',
      diaSemana: _diaSemana(json['diaSemana']),
      horaInicio: json['horaInicio']?.toString() ?? '',
      horaFim: json['horaFim']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'disciplina': disciplina,
    'professor': professor,
    'sala': sala,
    'diaSemana': diaSemana,
    'horaInicio': horaInicio,
    'horaFim': horaFim,
  };
}
