class ApiEndpoints {
  ApiEndpoints._();

  static const String health = '/health';

  static const String authLogin = '/auth/login';
  static const String authRefresh = '/auth/refresh';
  static const String authLogout = '/auth/logout';
  static const String authMe = '/auth/me';

  static const String alunos = '/alunos';
  static String alunoById(String id) => '/alunos/$id';
  static String alunoFoto(String id) => '/alunos/$id/foto';
  static String alunoFrequencia(String id) => '/alunos/$id/frequencia';
  static String alunoFrequenciaDisciplinas(String id) =>
      '/alunos/$id/frequencia/disciplinas';

  static const String turmas = '/turmas';
  static String turmaById(String id) => '/turmas/$id';
  static String turmaAlunos(String id) => '/turmas/$id/alunos';
  static String turmaFrequenciaConsolidado(String id) =>
      '/turmas/$id/frequencia/consolidado';

  static const String disciplinas = '/disciplinas';
  static String disciplinaById(String id) => '/disciplinas/$id';

  static const String presencas = '/presencas';
  static const String presencasHoje = '/presencas/hoje';
  static const String presencasBatch = '/presencas/batch';
  static String presencasAluno(String id) => '/presencas/aluno/$id';
  static String presencasTurma(String id) => '/presencas/turma/$id';
  static String presencaSaida(String id) => '/presencas/$id/saida';
  static String presencaJustificar(String id) => '/justificativas/$id/justificar';

  static const String dashboardResumo = '/dashboard/resumo';

  static const String iaHealth = '/ia/health';
  static const String iaRegistrarPresenca = '/ia/registrar-presenca';

  static const String relatorioMensal = '/relatorios/mensal';
  static const String relatorioCozinha = '/relatorios/cozinha';
  static const String relatorioAusentes = '/relatorios/secretaria/ausentes';
  static const String relatorioBaixaFrequencia =
      '/relatorios/secretaria/baixa-frequencia';
}
