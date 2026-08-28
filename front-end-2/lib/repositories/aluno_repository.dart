import '../data/api/api_aluno_data_source.dart';
import '../models/aluno.dart';

class AlunoRepository {
  // 👇 1. Mudou aqui dentro do parênteses
  AlunoRepository({ApiAlunoDataSource? dataSource})
    : _dataSource = dataSource ?? ApiAlunoDataSource();

  // 👇 2. Mudou aqui na declaração final
  final ApiAlunoDataSource _dataSource;

  Future<List<Aluno>> listar({String? busca, String? turma}) =>
      _dataSource.listar(busca: busca, turma: turma);

  Future<Aluno> criar({
    required String nome,
    required String ra,
    required String turma,
  }) => _dataSource.criar(nome: nome, ra: ra, turma: turma);

  Future<Aluno> atualizar(Aluno aluno) => _dataSource.atualizar(aluno);

  Future<void> remover(String id) => _dataSource.remover(id);

  Future<bool> raJaExiste(String ra, {String? ignorandoId}) =>
      _dataSource.raJaExiste(ra, ignorandoId: ignorandoId);
}