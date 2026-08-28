/// Formatadores de data e hora em português (pt-BR), sem dependências externas.
class AppFormatters {
  AppFormatters._();

  static const List<String> _meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  // DateTime.weekday: 1 = segunda-feira ... 7 = domingo
  static const List<String> _diasSemana = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  static String _dois(int n) => n.toString().padLeft(2, '0');

  /// Ex.: "Segunda-feira, 15 de junho de 2026"
  static String dataCompleta(DateTime d) =>
      '${_diasSemana[d.weekday - 1]}, ${d.day} de ${_meses[d.month - 1]} de ${d.year}';

  /// Ex.: "15/06/2026"
  static String dataCurta(DateTime d) =>
      '${_dois(d.day)}/${_dois(d.month)}/${d.year}';

  /// Ex.: "07:12"
  static String hora(DateTime d) => '${_dois(d.hour)}:${_dois(d.minute)}';

  /// Ex.: "07:12:45"
  static String horaCompleta(DateTime d) =>
      '${_dois(d.hour)}:${_dois(d.minute)}:${_dois(d.second)}';

  /// Ex.: "15/06/2026 às 07:12"
  static String dataHora(DateTime d) => '${dataCurta(d)} às ${hora(d)}';
}
