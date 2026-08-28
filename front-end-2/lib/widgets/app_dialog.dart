import 'package:flutter/material.dart';

/// Dialogs padronizados do aplicativo.
class AppDialog {
  AppDialog._();

  /// Dialog informativo com ícone, título, conteúdo e botão de fechar.
  static Future<void> info(
    BuildContext context, {
    required String titulo,
    required Widget conteudo,
    IconData icone = Icons.info_outline,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        icon: Icon(icone, color: scheme.primary, size: 36),
        title: Text(titulo, textAlign: TextAlign.center),
        content: conteudo,
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  /// Dialog de confirmação. Retorna `true` quando o usuário confirma.
  static Future<bool> confirmar(
    BuildContext context, {
    required String titulo,
    required String mensagem,
    String textoConfirmar = 'Confirmar',
    String textoCancelar = 'Cancelar',
  }) async {
    final resultado = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(titulo),
        content: Text(mensagem),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(textoCancelar),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(textoConfirmar),
          ),
        ],
      ),
    );
    return resultado ?? false;
  }
}
