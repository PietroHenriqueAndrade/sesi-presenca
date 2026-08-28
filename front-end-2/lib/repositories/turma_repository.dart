import '../data/api/api_turma_data_source.dart';
import '../models/turma.dart';

class TurmaRepository {
  // 👇 1. Mudou aqui dentro do parênteses
  TurmaRepository({ApiTurmaDataSource? dataSource})
    : _dataSource = dataSource ?? ApiTurmaDataSource();

  // 👇 2. Mudou aqui na declaração final
  final ApiTurmaDataSource _dataSource;

  Future<List<Turma>> listar({String? busca}) =>
      _dataSource.listar(busca: busca);

  Future<List<String>> listarNomes() => _dataSource.listarNomes();

  Future<Turma> criar({
    required String nome,
    required String serie,
    required TurnoTurma turno,
    required String sala,
  }) => _dataSource.criar(nome: nome, serie: serie, turno: turno, sala: sala);

  Future<Turma> atualizar(Turma turma) => _dataSource.atualizar(turma);

  Future<void> remover(String id) => _dataSource.remover(id);
}