import 'package:flutter/material.dart';

/// Cabeçalho de seção com título à esquerda e ação opcional à direita.
class SectionHeader extends StatelessWidget {
  final String titulo;
  final Widget? acao;

  const SectionHeader({super.key, required this.titulo, this.acao});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(titulo, style: Theme.of(context).textTheme.titleMedium),
          if (acao != null) acao!,
        ],
      ),
    );
  }
}
