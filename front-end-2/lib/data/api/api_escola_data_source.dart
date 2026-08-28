import '../../core/network/api_client.dart';
import '../../core/network/api_payload.dart';
import '../../models/horario.dart';
import '../../models/notificacao.dart';

class ApiEscolaDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<Horario> buscarProximaAula(String turmaId) async {
    final res = await _apiClient.get('/horarios/turma/$turmaId/agora');
    return Horario.fromJson(ApiPayload.object(res));
  }

  Future<List<Notificacao>> listarNotificacoes() async {
    final res = await _apiClient.get('/alertas');
    return ApiPayload.list(res)
        .map((e) => Notificacao.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }
}
