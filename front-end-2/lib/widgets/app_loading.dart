import 'package:flutter/material.dart';

/// Indicador de carregamento centralizado com rótulo opcional.
class AppLoading extends StatelessWidget {
  final String? mensagem;

  const AppLoading({super.key, this.mensagem});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          if (mensagem != null) ...[
            const SizedBox(height: 16),
            Text(mensagem!, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}
