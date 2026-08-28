/// Modelo de aluno usado pelo Flutter e pela API Node.
class Aluno {
  final String id;
  final String nome;
  final String ra;
  final String turma;
  final String? turmaId;
  final String? fotoUrl;

  const Aluno({
    required this.id,
    required this.nome,
    required this.ra,
    required this.turma,
    this.turmaId,
    this.fotoUrl,
  });

  String get iniciais {
    final partes = nome.trim().split(RegExp(r'\s+'));
    if (partes.isEmpty || partes.first.isEmpty) return '?';
    if (partes.length == 1) return partes.first[0].toUpperCase();
    return (partes.first[0] + partes.last[0]).toUpperCase();
  }

  factory Aluno.fromJson(Map<String, dynamic> json) {
    String turmaNome = '';
    String? turmaId;

    final turmaDireta = json['turma'];
    if (turmaDireta is Map) {
      turmaNome = turmaDireta['nome']?.toString() ?? '';
      turmaId = turmaDireta['id']?.toString();
    } else if (turmaDireta is String) {
      turmaNome = turmaDireta;
    }

    final vinculos = json['turmas'];
    if (vinculos is List) {
      for (final item in vinculos) {
        if (item is! Map || item['ativo'] == false) continue;
        final turma = item['turma'];
        turmaId = item['turmaId']?.toString() ??
            (turma is Map ? turma['id']?.toString() : null);
        turmaNome = turma is Map ? turma['nome']?.toString() ?? '' : turmaNome;
        break;
      }
    }

    return Aluno(
      id: json['id']?.toString() ?? '',
      nome: json['nome']?.toString() ?? '',
      ra: (json['ra'] ?? json['matricula'])?.toString() ?? '',
      turma: turmaNome,
      turmaId: turmaId,
      fotoUrl: (json['fotoUrl'] ?? json['fotoTreinamento'])?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'nome': nome,
    'matricula': ra,
    if (turmaId != null && turmaId!.isNotEmpty) 'turmaId': turmaId,
  };
}
