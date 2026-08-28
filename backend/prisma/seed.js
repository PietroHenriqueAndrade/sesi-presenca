const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const IS_PRODUCTION = NODE_ENV === 'production';
const RESET_PASSWORDS = String(process.env.SEED_RESET_PASSWORDS || '').toLowerCase() === 'true';
const CREATE_DEMO_USERS = !IS_PRODUCTION || String(process.env.SEED_CREATE_DEMO_USERS || '').toLowerCase() === 'true';
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@senai.br').trim().toLowerCase();
const SENHA_ADMIN_TEXTO = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026';
const SENHA_PROFESSOR_TEXTO = process.env.SEED_DEFAULT_PASSWORD || 'Senai@2026';

function validarCredenciaisSeed() {
  if (!IS_PRODUCTION) return;
  const inseguras = [
    !process.env.SEED_ADMIN_PASSWORD,
    SENHA_ADMIN_TEXTO === 'Admin@2026',
    SENHA_ADMIN_TEXTO.length < 12,
    ...(CREATE_DEMO_USERS ? [
      !process.env.SEED_DEFAULT_PASSWORD,
      SENHA_PROFESSOR_TEXTO === 'Senai@2026',
      SENHA_PROFESSOR_TEXTO.length < 12,
    ] : []),
  ];
  if (inseguras.some(Boolean)) {
    throw new Error(
      'Seed bloqueado em produção: defina SEED_ADMIN_PASSWORD forte (12+ caracteres). SEED_DEFAULT_PASSWORD só é exigida quando SEED_CREATE_DEMO_USERS=true.'
    );
  }
}

async function garantirTurma(nome) {
  let turma = await prisma.turma.findFirst({
    where: { nome, anoLetivo: 2026, turno: 'MANHA' },
  });
  if (!turma) {
    turma = await prisma.turma.create({
      data: { nome, anoLetivo: 2026, turno: 'MANHA', ativo: true },
    });
  } else if (!turma.ativo) {
    turma = await prisma.turma.update({ where: { id: turma.id }, data: { ativo: true } });
  }
  return turma;
}

async function matricularAlunos(turma, alunos, prefixoMatricula) {
  for (let i = 0; i < alunos.length; i += 1) {
    const nome = alunos[i];
    const matricula = `${prefixoMatricula}${String(i + 1).padStart(3, '0')}`;

    const aluno = await prisma.aluno.upsert({
      where: { matricula },
      update: { nome, ativo: true },
      create: { nome, matricula, ativo: true },
    });

    await prisma.turmaAluno.upsert({
      where: { alunoId_turmaId: { alunoId: aluno.id, turmaId: turma.id } },
      update: { ativo: true },
      create: { alunoId: aluno.id, turmaId: turma.id, ativo: true },
    });
  }
}

async function garantirUsuario({ nome, email, senhaTexto, role }) {
  const senhaHash = await bcrypt.hash(senhaTexto, 12);
  const existente = await prisma.usuario.findUnique({ where: { email } });

  if (!existente) {
    return prisma.usuario.create({
      data: { nome, email, senha: senhaHash, role, ativo: true },
    });
  }

  return prisma.usuario.update({
    where: { id: existente.id },
    data: {
      nome,
      role,
      ativo: true,
      ...(RESET_PASSWORDS ? { senha: senhaHash, tokenVersion: { increment: 1 } } : {}),
    },
  });
}

async function garantirGrade(turmaId, grade) {
  for (const aula of grade) {
    const existente = await prisma.horario.findFirst({
      where: {
        turmaId,
        disciplinaId: aula.disciplinaId,
        diaSemana: aula.diaSemana,
        horaInicio: aula.horaInicio,
        horaFim: aula.horaFim,
      },
    });
    if (!existente) {
      await prisma.horario.create({ data: { turmaId, ...aula, ativo: true } });
    } else if (!existente.ativo) {
      await prisma.horario.update({ where: { id: existente.id }, data: { ativo: true } });
    }
  }
}

async function main() {
  validarCredenciaisSeed();
  console.log('🌱 Preparando dados iniciais do SESI Presença...');

  const turma3A = await garantirTurma('3 A');
  const turma3B = await garantirTurma('3 B');
  console.log('✅ Turmas 3 A e 3 B verificadas.');

  const alunos3A = [
    'ANA BEATRIZ PEREIRA DOS SANTOS', 'ANA CLARA DE CARVALHO NASCIMENTO', 'ANNA LUIZA GOMES SILVA',
    'AQUILES LUIZ NUNES BASTOS', 'CAINAN BASTOS DA SILVA', 'DERICK LUIZ CAETANO MIGUEL',
    'ESTELLA DE ALMEIDA ROSA', 'FRANCISCO GABRIEL DE OLIVEIRA PASSOS', 'GLORIA MARIA MOURA BRUNO DE CARVALHO',
    'HELOISA FRANCISCO DIONISIO', 'HENRY GUIMARÃES ALVES', 'INGRID RANI FORTUNATO DOS SANTOS',
    'JOÃO GABRIEL DA SILVA PEREIRA', 'JOÃO PEDRO DE AQUINO HONORATO', 'JOÃO PEDRO MARTINS LIGABO',
    'JOÃO PEDRO RODRIGUES DOS SANTOS', 'JUAN PEDRO DE MIRANDA', 'JULIA DE MOURA LOPES DA SILVA',
    'MARCOS VINICIUS SORIANO GUATURA', 'MARIA EDUARDA FELIX INOCENCIO', 'MARIA ISABEL DA SILVA COSTA BORGES',
    'MARIANA DE SOUZA MARTINS DOS SANTOS', 'MARIANA SILVA DE ANDRADE', 'MIGUEL ARAUJO DE GODOI FREITAS',
    'NATHALIA ALVES ABDO REZENDE', 'NEIL LOPES JOÃO FILHO', 'NICOLAS FELIPE DO NASCIMENTO ROSA',
    'PIETRO HENRIQUE GOMES DE ANDRADE', 'SAMUEL RODRIGUES COSTA FREIRE', 'VICTOR HUGO DO CARMO DE JESUS',
  ];

  const alunos3B = [
    'Ágatha Gerônimo de Souza',
    'Agatha Mytria Eugênio Galvão',
    'Alicia Souza Reis Fabiano',
    'Ana Clara da Silva Lopes',
    'Ana Clara da Silva Rosa',
    'Ana Clara Rodrigues',
    'Anna Beatriz Gonzaga Fialho',
    'Anna Carolina de Almeida',
    'Anna Livia Rachel dos Santos',
    'Bárbara Guatura Chagas',
    'Gabriel Ivanildo Araujo de Carvalho',
    'Gabriel Luiz Andrade de Oliveira',
    'Gabriela dos Santos Cardoso Alves',
    'José Luiz de Sousa Oliveira',
    'Julia Helena Diniz da Silva',
    'Jullia Bastos Ribeiro',
    'Kalel da Cunha Souza Fernandes',
    'Kauan da Silva Santos',
    'Luiz Guilherme de Alcantara Silva',
    'Maria Clara Dias Baesso',
    'Marianny Orfão Terra',
    'Melissa Espindola',
    'Miguel de Oliveira Rodrigues da Silva',
    'Murilo Gonçalves Parreiras Jannuzzelli',
    'Natalia Aquino de Almeida',
    'Nathan da Silva Santos',
    'Nicoly Souza Marioto',
    'Paola Diniz de Souza',
    'Rafael Massao de Oliveira',
    'Renata Ageu da Silva Cardoso',
    'Yago Andrade Molina',
    'Miguel da Silva Miranda Rodrigues',
  ];

  await matricularAlunos(turma3A, alunos3A, '2026');
  await matricularAlunos(turma3B, alunos3B, '2026B');
  console.log(`✅ ${alunos3A.length} alunos no 3 A e ${alunos3B.length} alunos no 3 B.`);

  await garantirUsuario({
    nome: 'Administrador TCC',
    email: ADMIN_EMAIL,
    senhaTexto: SENHA_ADMIN_TEXTO,
    role: 'ADMIN',
  });

  if (CREATE_DEMO_USERS) {
    const professores = [
      { nome: 'Diogo', email: 'diogo@senai.br' },
      { nome: 'Kelvius', email: 'kelvius@senai.br' },
      { nome: 'Larissa', email: 'larissa@senai.br' },
      { nome: 'Rodrigo', email: 'rodrigo@senai.br' },
      { nome: 'Luiz Gustavo', email: 'luiz.gustavo@senai.br' },
      { nome: 'Marcia Barbosa', email: 'marcia@senai.br' },
      { nome: 'Denis', email: 'denis@senai.br' },
      { nome: 'Professor de Português', email: 'portugues@senai.br' },
    ];
  
    for (const professor of professores) {
      await garantirUsuario({
        ...professor,
        senhaTexto: SENHA_PROFESSOR_TEXTO,
        role: 'PROFESSOR',
      });
    }
  } else {
    console.log('ℹ️  Produção: usuários de professor de demonstração não foram criados. Cadastre contas individuais pelo Dashboard.');
  }
  console.log('✅ Usuários de seed verificados sem expor senhas no log.');

  const disciplinasDados = [
    { nome: 'Física', codigo: 'FIS' },
    { nome: 'Matemática', codigo: 'MAT' },
    { nome: 'Inglês', codigo: 'ING' },
    { nome: 'Biologia', codigo: 'BIO' },
    { nome: 'Língua Portuguesa', codigo: 'PORT' },
    { nome: 'História', codigo: 'HIST' },
    { nome: 'Geografia', codigo: 'GEO' },
    { nome: 'Química', codigo: 'QUI' },
  ];

  const disciplinas = {};
  for (const disc of disciplinasDados) {
    const salva = await prisma.disciplina.upsert({
      where: { codigo: disc.codigo },
      update: { nome: disc.nome, ativo: true },
      create: { ...disc, ativo: true },
    });
    disciplinas[disc.codigo] = salva.id;
  }

  // Mantém a grade conhecida da turma 3 A sem apagar horários existentes.
  const grade3A = [
    { diaSemana: 'TERCA', horaInicio: '07:00', horaFim: '07:50', disciplinaId: disciplinas.FIS },
    { diaSemana: 'TERCA', horaInicio: '07:50', horaFim: '08:40', disciplinaId: disciplinas.FIS },
    { diaSemana: 'TERCA', horaInicio: '08:40', horaFim: '09:30', disciplinaId: disciplinas.MAT },
    { diaSemana: 'TERCA', horaInicio: '09:50', horaFim: '10:40', disciplinaId: disciplinas.MAT },
    { diaSemana: 'TERCA', horaInicio: '10:40', horaFim: '11:30', disciplinaId: disciplinas.ING },
    { diaSemana: 'TERCA', horaInicio: '11:30', horaFim: '12:20', disciplinaId: disciplinas.ING },
    { diaSemana: 'QUARTA', horaInicio: '07:00', horaFim: '07:50', disciplinaId: disciplinas.MAT },
    { diaSemana: 'QUARTA', horaInicio: '07:50', horaFim: '08:40', disciplinaId: disciplinas.MAT },
    { diaSemana: 'QUARTA', horaInicio: '08:40', horaFim: '09:30', disciplinaId: disciplinas.BIO },
    { diaSemana: 'QUARTA', horaInicio: '09:50', horaFim: '10:40', disciplinaId: disciplinas.BIO },
    { diaSemana: 'QUARTA', horaInicio: '10:40', horaFim: '11:30', disciplinaId: disciplinas.PORT },
    { diaSemana: 'QUARTA', horaInicio: '11:30', horaFim: '12:20', disciplinaId: disciplinas.PORT },
    { diaSemana: 'QUINTA', horaInicio: '07:00', horaFim: '07:50', disciplinaId: disciplinas.PORT },
    { diaSemana: 'QUINTA', horaInicio: '07:50', horaFim: '08:40', disciplinaId: disciplinas.PORT },
    { diaSemana: 'QUINTA', horaInicio: '08:40', horaFim: '09:30', disciplinaId: disciplinas.HIST },
    { diaSemana: 'QUINTA', horaInicio: '09:50', horaFim: '10:40', disciplinaId: disciplinas.GEO },
    { diaSemana: 'QUINTA', horaInicio: '10:40', horaFim: '11:30', disciplinaId: disciplinas.QUI },
    { diaSemana: 'QUINTA', horaInicio: '11:30', horaFim: '12:20', disciplinaId: disciplinas.QUI },
  ];

  await garantirGrade(turma3A.id, grade3A);
  console.log('✅ Grade conhecida do 3 A verificada sem delete destrutivo.');
  console.log('ℹ️  O 3 B foi cadastrado com seus alunos. Configure a grade real do 3 B pelo Dashboard antes de usar presença automática nessa turma.');
  console.log('🚀 Seed concluído.');
}

main()
  .catch((error) => {
    console.error('Erro ao rodar o seed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
