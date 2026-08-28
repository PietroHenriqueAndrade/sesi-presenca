import 'package:flutter/material.dart';

import 'app_card.dart';

/// Card de indicador numérico (KPI) usado no Dashboard — ícone, valor em
/// destaque e rótulo.
class StatCard extends StatelessWidget {
  final IconData icone;
  final String valor;
  final String rotulo;
  final Color cor;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.icone,
    required this.valor,
    required this.rotulo,
    required this.cor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: cor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icone, color: cor, size: 22),
          ),
          const SizedBox(height: 14),
          Text(valor, style: textTheme.headlineMedium?.copyWith(fontSize: 26)),
          const SizedBox(height: 2),
          Text(
            rotulo,
            style: textTheme.bodySmall,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
