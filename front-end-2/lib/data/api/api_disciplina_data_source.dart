import '../../core/network/api_client.dart';
import '../../core/network/api_payload.dart';
import '../../models/disciplina.dart';

class ApiDisciplinaDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<List<Disciplina>> listar({String? busca}) async {
    final res = await _apiClient.get('/disciplinas', query: {if (busca != null && busca.trim().isNotEmpty) 'busca': busca});
    return ApiPayload.list(res).whereType<Map>().map((e) => Disciplina.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  Future<Disciplina> criar({required String nome, required String professor, required int cargaHoraria}) async {
    final res = await _apiClient.post('/disciplinas', body: {'nome': nome, 'professor': professor, 'cargaHoraria': cargaHoraria});
    return Disciplina.fromJson(ApiPayload.object(res));
  }

  Future<Disciplina> atualizar(Disciplina disciplina) async {
    final res = await _apiClient.patch('/disciplinas/${disciplina.id}', body: disciplina.toJson());
    return Disciplina.fromJson(ApiPayload.object(res));
  }

  Future<void> remover(String id) async => _apiClient.delete('/disciplinas/$id');
}