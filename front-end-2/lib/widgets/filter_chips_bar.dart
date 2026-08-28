import 'package:flutter/material.dart';

/// Um item selecionável na [FilterChipsBar].
class FilterChipItem<T> {
  final String label;
  final T value;
  const FilterChipItem({required this.label, required this.value});
}

/// Linha horizontal de chips de seleção única, reutilizada em todas as
/// telas que possuem filtro (Histórico, Alunos, Turmas, Disciplinas,
/// Relatórios).
class FilterChipsBar<T> extends StatelessWidget {
  final List<FilterChipItem<T>> itens;
  final T? selecionado;
  final ValueChanged<T?> onSelecionar;
  final EdgeInsetsGeometry padding;

  const FilterChipsBar({
    super.key,
    required this.itens,
    required this.selecionado,
    required this.onSelecionar,
    this.padding = const EdgeInsets.symmetric(horizontal: 20),
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding,
        itemCount: itens.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = itens[index];
          final ativo = item.value == selecionado;
          return ChoiceChip(
            label: Text(item.label),
            selected: ativo,
            onSelected: (_) => onSelecionar(item.value),
            selectedColor: scheme.primary,
            labelStyle: TextStyle(
              color: ativo ? Colors.white : null,
              fontWeight: FontWeight.w600,
            ),
          );
        },
      ),
    );
  }
}
