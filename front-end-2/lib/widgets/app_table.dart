import 'package:flutter/material.dart';

import 'app_card.dart';

/// Coluna de uma [AppTable].
class AppTableColumn {
  final String titulo;
  final bool numerica;
  const AppTableColumn(this.titulo, {this.numerica = false});
}

/// Tabela reutilizável usada pelas telas de listagem (Alunos, Turmas,
/// Disciplinas) em telas largas/tablets, mantendo o mesmo visual entre
/// os três CRUDs.
class AppTable extends StatelessWidget {
  final List<AppTableColumn> colunas;
  final List<List<Widget>> linhas;

  const AppTable({super.key, required this.colunas, required this.linhas});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return AppCard(
      padding: EdgeInsets.zero,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            scheme.primary.withValues(alpha: 0.06),
          ),
          columns: [
            for (final coluna in colunas)
              DataColumn(
                label: Text(
                  coluna.titulo,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                numeric: coluna.numerica,
              ),
          ],
          rows: [
            for (final linha in linhas)
              DataRow(cells: [for (final c in linha) DataCell(c)]),
          ],
        ),
      ),
    );
  }
}
