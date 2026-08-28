/// Textos da interface centralizados (pt-BR).
///
/// Centralizar as strings facilita futura internacionalização (i18n)
/// e evita duplicação de literais nas telas.
class AppStrings {
  AppStrings._();

  // Gerais
  static const String voltar = 'Voltar';
  static const String cancelar = 'Cancelar';
  static const String confirmar = 'Confirmar';
  static const String carregando = 'Carregando...';

  // Home
  static const String iniciarReconhecimento = 'Iniciar Reconhecimento Facial';
  static const String historico = 'Histórico';
  static const String sincronizacao = 'Sincronização';
  static const String configuracoes = 'Configurações';
  static const String online = 'Online';
  static const String offline = 'Offline';
  static const String proximaAula = 'Próxima aula';
  static const String notificacoes = 'Notificações';

  // Reconhecimento
  static const String posicioneSeuRosto = 'Posicione seu rosto';
  static const String simularReconhecimento = 'Simular Reconhecimento';
  static const String analisandoRosto = 'Analisando rosto...';
  static const String entradaRegistrada = 'Entrada registrada com sucesso';
  static const String faceNaoReconhecida = 'Face não reconhecida';
  static const String tentarNovamente = 'Tentar novamente';
  static const String voltarAoInicio = 'Voltar ao início';

  // Histórico
  static const String buscarAluno = 'Buscar aluno...';
  static const String nenhumRegistro = 'Nenhum registro encontrado';
  static const String entrada = 'Entrada';
  static const String saida = 'Saída';

  // Sincronização
  static const String internet = 'Internet';
  static const String servidor = 'Servidor';
  static const String bancoLocal = 'Banco local';
  static const String registrosPendentes = 'Registros pendentes';
  static const String sincronizar = 'Sincronizar';
  static const String sincronizando = 'Sincronizando...';
  static const String sincronizacaoConcluida =
      'Sincronização concluída com sucesso';
  static const String ultimaSincronizacao = 'Última sincronização';

  // Configurações
  static const String tema = 'Tema';
  static const String temaEscuro = 'Tema escuro';
  static const String idioma = 'Idioma';
  static const String versao = 'Versão';
  static const String sobreOSistema = 'Sobre o sistema';

  // Autenticação
  static const String entrar = 'Entrar';
  static const String email = 'E-mail';
  static const String senha = 'Senha';
  static const String esqueciSenha = 'Esqueci minha senha';
  static const String sair = 'Sair';
  static const String recuperarSenha = 'Recuperar senha';
  static const String enviarLinkRecuperacao = 'Enviar link de recuperação';
  static const String emailRecuperacaoEnviado =
      'Se o e-mail existir, um link de recuperação será enviado.';

  // Dashboard / navegação
  static const String dashboard = 'Dashboard';
  static const String alunos = 'Alunos';
  static const String turmas = 'Turmas';
  static const String disciplinas = 'Disciplinas';
  static const String presencas = 'Presenças';
  static const String relatorios = 'Relatórios';
  static const String perfil = 'Perfil';
  static const String reconhecimentoFacial = 'Reconhecimento facial';
  static const String bemVindo = 'Bem-vindo(a)';

  // CRUD genérico
  static const String buscar = 'Buscar...';
  static const String novo = 'Novo';
  static const String editar = 'Editar';
  static const String excluir = 'Excluir';
  static const String salvar = 'Salvar';
  static const String nenhumResultado = 'Nenhum resultado encontrado';
  static const String confirmarExclusaoTitulo = 'Confirmar exclusão';
  static const String cadastroSalvoComSucesso = 'Cadastro salvo com sucesso';
  static const String registroExcluidoComSucesso =
      'Registro excluído com sucesso';
  static const String campoObrigatorio = 'Campo obrigatório';

  // Relatórios
  static const String exportarSimulado = 'Exportar (simulado)';
  static const String relatorioExportado =
      'Relatório exportado com sucesso (simulação)';
}
