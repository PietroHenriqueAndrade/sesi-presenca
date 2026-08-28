import 'package:flutter/material.dart';

/// Gráfico de barras simples, construído sem dependências externas.
///
/// Usado no Dashboard e em Relatórios para representar visualmente
/// dados consolidados (ex.: presenças por dia).
class MiniBarChart extends StatelessWidget {
  final List<int> valores;
  final List<String> rotulos;
  final Color cor;
  final double altura;

  const MiniBarChart({
    super.key,
    required this.valores,
    required this.rotulos,
    required this.cor,
    this.altura = 140,
  });

  @override
  Widget build(BuildContext context) {
    final maximo = valores.isEmpty
        ? 1
        : valores.reduce((a, b) => a > b ? a : b).clamp(1, 1 << 30);
    final textTheme = Theme.of(context).textTheme;

    return SizedBox(
      height: altura,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < valores.length; i++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      '${valores[i]}',
                      style: textTheme.bodySmall?.copyWith(fontSize: 10),
                    ),
                    const SizedBox(height: 4),
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: valores[i] / maximo),
                      duration: Duration(milliseconds: 500 + i * 60),
                      curve: Curves.easeOutCubic,
                      builder: (context, fator, _) => Container(
                        height: (altura - 44) * fator.clamp(0.03, 1.0),
                        decoration: BoxDecoration(
                          color: cor,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(6),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      i < rotulos.length ? rotulos[i] : '',
                      style: textTheme.bodySmall?.copyWith(fontSize: 10),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
