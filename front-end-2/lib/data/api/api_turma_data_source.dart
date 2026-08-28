import '../../core/network/api_client.dart';
import '../../core/network/api_payload.dart';
import '../../models/turma.dart';

class ApiTurmaDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<List<Turma>> listar({String? busca}) async {
    final res = await _apiClient.get('/turmas', query: {if (busca != null && busca.trim().isNotEmpty) 'busca': busca});
    return ApiPayload.list(res).whereType<Map>().map((e) => Turma.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  Future<List<String>> listarNomes() async {
    final res = await _apiClient.get('/turmas');
    return ApiPayload.list(res).whereType<Map>().map((e) => e['nome'].toString()).toList();
  }

  Future<Turma> criar({required String nome, required String serie, required TurnoTurma turno, required String sala}) async {
    final res = await _apiClient.post('/turmas', body: {'nome': nome, 'anoLetivo': int.parse(serie), 'turno': turno.backendValue, 'sala': sala});
    return Turma.fromJson(ApiPayload.object(res));
  }

  Future<Turma> atualizar(Turma turma) async {
    final res = await _apiClient.patch('/turmas/${turma.id}', body: turma.toJson());
    return Turma.fromJson(ApiPayload.object(res));
  }

  Future<void> remover(String id) async => _apiClient.delete('/turmas/$id');
}