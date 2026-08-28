import '../data/api/api_disciplina_data_source.dart';
import '../models/disciplina.dart';

class DisciplinaRepository {
  // 👇 1. Mudou aqui dentro do parênteses
  DisciplinaRepository({ApiDisciplinaDataSource? dataSource})
    : _dataSource = dataSource ?? ApiDisciplinaDataSource();

  // 👇 2. Mudou aqui na declaração final
  final ApiDisciplinaDataSource _dataSource;

  Future<List<Disciplina>> listar({String? busca}) =>
      _dataSource.listar(busca: busca);

  Future<Disciplina> criar({
    required String nome,
    required String professor,
    required int cargaHoraria,
  }) => _dataSource.criar(
    nome: nome,
    professor: professor,
    cargaHoraria: cargaHoraria,
  );

  Future<Disciplina> atualizar(Disciplina disciplina) =>
      _dataSource.atualizar(disciplina);

  Future<void> remover(String id) => _dataSource.remover(id);
}