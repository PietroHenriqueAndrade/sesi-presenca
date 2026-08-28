import '../core/network/api_client.dart';
import '../core/network/api_endpoints.dart';
import '../core/network/api_exception.dart';

class ResumoDashboard {
  final int totalAlunos;
  final int totalTurmas;
  final int presentesHoje;
  final int faltasHoje;
  final int atrasadosHoje;
  final double frequenciaMedia;
  final List<int> presencasUltimos7Dias;

  const ResumoDashboard({
    required this.totalAlunos,
    required this.totalTurmas,
    required this.presentesHoje,
    required this.faltasHoje,
    required this.atrasadosHoje,
    required this.frequenciaMedia,
    required this.presencasUltimos7Dias,
  });
}

/// Consome o resumo consolidado calculado pelo backend.
///
/// Isso mantém Flutter e o futuro Dashboard React com a mesma fonte de verdade
/// para indicadores, evitando regras de frequência duplicadas no frontend.
class DashboardRepository {
  DashboardRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<ResumoDashboard> buscarResumo() async {
    final resposta = await _apiClient.get(ApiEndpoints.dashboardResumo);
    final rawData = resposta['data'];
    if (rawData is! Map) {
      throw const ApiException('Resposta inválida do resumo do dashboard.');
    }
    final data = Map<String, dynamic>.from(rawData);
    final cadastrosRaw = data['cadastros'];
    final hojeRaw = data['hoje'];
    final serieRaw = data['ultimos7Dias'];

    if (cadastrosRaw is! Map || hojeRaw is! Map || serieRaw is! List) {
      throw const ApiException('Contrato do dashboard incompatível com o aplicativo.');
    }

    final cadastros = Map<String, dynamic>.from(cadastrosRaw);
    final hoje = Map<String, dynamic>.from(hojeRaw);
    final porStatusRaw = hoje['porStatus'];
    final porStatus = porStatusRaw is Map
        ? Map<String, dynamic>.from(porStatusRaw)
        : <String, dynamic>{};

    int valor(String chave) => (porStatus[chave] as num?)?.toInt() ?? 0;
    final presentes = (hoje['comparecimentos'] as num?)?.toInt() ?? 0;
    final total = (hoje['totalRegistros'] as num?)?.toInt() ?? 0;
    final frequencia = total == 0 ? 0.0 : (presentes / total) * 100;

    final serie = serieRaw.map((item) {
      if (item is! Map) return 0;
      final dia = Map<String, dynamic>.from(item);
      return ((dia['PRESENTE'] as num?)?.toInt() ?? 0) +
          ((dia['ATRASO'] as num?)?.toInt() ?? 0) +
          ((dia['SAIDA_ANTECIPADA'] as num?)?.toInt() ?? 0);
    }).toList(growable: false);

    return ResumoDashboard(
      totalAlunos: (cadastros['alunosAtivos'] as num?)?.toInt() ?? 0,
      totalTurmas: (cadastros['turmasAtivas'] as num?)?.toInt() ?? 0,
      presentesHoje: presentes,
      faltasHoje: valor('AUSENTE'),
      atrasadosHoje: valor('ATRASO'),
      frequenciaMedia: frequencia.clamp(0, 100).toDouble(),
      presencasUltimos7Dias: serie,
    );
  }
}
