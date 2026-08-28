import '../../core/network/api_client.dart';
import '../../core/network/api_payload.dart';
import '../../models/aluno.dart';

class ApiAlunoDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<List<Aluno>> listar({String? busca, String? turma}) async {
    final res = await _apiClient.get(
      '/alunos',
      query: {
        if (busca != null && busca.trim().isNotEmpty) 'busca': busca,
        if (turma != null && turma.trim().isNotEmpty) 'turma': turma,
        'limit': 100,
      },
    );

    return ApiPayload.list(res)
        .whereType<Map>()
        .map((e) => Aluno.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<Aluno> criar({
    required String nome,
    required String ra,
    required String turma,
  }) async {
    final res = await _apiClient.post(
      '/alunos',
      body: {'nome': nome, 'matricula': ra, 'turmaId': turma},
    );
    return Aluno.fromJson(ApiPayload.object(res));
  }

  Future<Aluno> atualizar(Aluno aluno) async {
    final res = await _apiClient.patch(
      '/alunos/${aluno.id}',
      body: aluno.toJson(),
    );
    return Aluno.fromJson(ApiPayload.object(res));
  }

  Future<void> remover(String id) async => _apiClient.delete('/alunos/$id');

  Future<bool> raJaExiste(String ra, {String? ignorandoId}) async {
    final res = await _apiClient.get(
      '/alunos/check-ra/$ra',
      query: {if (ignorandoId != null && ignorandoId.isNotEmpty) 'ignorandoId': ignorandoId},
    );
    final data = ApiPayload.object(res);
    final existe = data['existe'];
    return existe is bool ? existe : existe == true;
  }
}
