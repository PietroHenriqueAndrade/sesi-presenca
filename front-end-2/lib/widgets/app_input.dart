import 'package:flutter/material.dart';

/// Campo de texto padrão do aplicativo.
///
/// Encapsula o estilo global de inputs (bordas arredondadas, prefixo de
/// ícone) para manter consistência entre as telas.
class AppInput extends StatelessWidget {
  final String hint;
  final IconData? icon;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final TextInputType keyboardType;

  const AppInput({
    super.key,
    required this.hint,
    this.icon,
    this.controller,
    this.onChanged,
    this.keyboardType = TextInputType.text,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      keyboardType: keyboardType,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon) : null,
      ),
    );
  }
}
