function selecionarFaltasAutomaticas({ aulas = [], existentes = [], data, agora }) {
  const chaves = new Set(existentes.map((p) => `${p.alunoId}:${p.turmaId}`));
  const turmas = new Map();

  for (const aula of aulas) {
    if (aula?.turmaId && aula?.turma && !turmas.has(aula.turmaId)) turmas.set(aula.turmaId, aula.turma);
  }

  const faltas = [];
  for (const [turmaId, turma] of turmas) {
    for (const vinculo of turma.alunos || []) {
      if (!vinculo?.aluno?.ativo || !vinculo.alunoId) continue;
      const chave = `${vinculo.alunoId}:${turmaId}`;
      if (chaves.has(chave)) continue;
      chaves.add(chave);
      faltas.push({
        alunoId: vinculo.alunoId,
        turmaId,
        status: 'AUSENTE',
        origem: 'SISTEMA',
        dataHora: agora,
        data,
      });
    }
  }
  return faltas;
}

module.exports = { selecionarFaltasAutomaticas };
