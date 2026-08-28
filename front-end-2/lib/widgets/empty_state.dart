import 'package:flutter/material.dart';

/// Estado vazio padrão — ícone, mensagem e ação opcional.
///
/// Reutilizado por todas as telas de listagem (Alunos, Turmas,
/// Disciplinas, Relatórios, Histórico) para manter a mesma experiência
/// quando não há resultados.
class EmptyState extends StatelessWidget {
  final IconData icone;
  final String mensagem;
  final String? descricao;
  final Widget? acao;

  const EmptyState({
    super.key,
    this.icone = Icons.search_off,
    required this.mensagem,
    this.descricao,
    this.acao,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icone, size: 56, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: 12),
            Text(
              mensagem,
              textAlign: TextAlign.center,
              style: textTheme.titleMedium,
            ),
            if (descricao != null) ...[
              const SizedBox(height: 6),
              Text(
                descricao!,
                textAlign: TextAlign.center,
                style: textTheme.bodySmall,
              ),
            ],
            if (acao != null) ...[const SizedBox(height: 20), acao!],
          ],
        ),
      ),
    );
  }
}
