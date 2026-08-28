import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_face/core/network/api_client.dart';
import 'package:tcc_face/core/network/api_exception.dart';
import 'package:tcc_face/repositories/dashboard_repository.dart';

class FakeApiClient extends ApiClient {
  FakeApiClient(this.response);
  final Map<String, dynamic> response;

  @override
  Future<Map<String, dynamic>> get(
    String endpoint, {
    String? accessToken,
    Map<String, dynamic>? query,
  }) async => response;
}

void main() {
  test('DashboardRepository usa o resumo consolidado do backend', () async {
    final repository = DashboardRepository(
      apiClient: FakeApiClient({
        'status': 'success',
        'data': {
          'cadastros': {'alunosAtivos': 30, 'turmasAtivas': 2, 'disciplinasAtivas': 8},
          'hoje': {
            'totalRegistros': 10,
            'comparecimentos': 7,
            'porStatus': {
              'PRESENTE': 5,
              'ATRASO': 1,
              'SAIDA_ANTECIPADA': 1,
              'AUSENTE': 2,
              'JUSTIFICADO': 1,
            },
          },
          'ultimos7Dias': [
            {'PRESENTE': 5, 'ATRASO': 1, 'SAIDA_ANTECIPADA': 0},
            {'PRESENTE': 6, 'ATRASO': 0, 'SAIDA_ANTECIPADA': 1},
          ],
        },
      }),
    );

    final resumo = await repository.buscarResumo();

    expect(resumo.totalAlunos, 30);
    expect(resumo.totalTurmas, 2);
    expect(resumo.presentesHoje, 7);
    expect(resumo.faltasHoje, 2);
    expect(resumo.atrasadosHoje, 1);
    expect(resumo.frequenciaMedia, 70);
    expect(resumo.presencasUltimos7Dias, [6, 7]);
  });

  test('DashboardRepository rejeita contrato incompatível', () async {
    final repository = DashboardRepository(apiClient: FakeApiClient({'data': []}));
    expect(repository.buscarResumo(), throwsA(isA<ApiException>()));
  });
}
