import '../data/api/api_presenca_data_source.dart';
import '../models/presenca.dart';

class PresencaRepository {
  // 👇 1. Trocamos o tipo aqui no parênteses
  PresencaRepository({ApiPresencaDataSource? dataSource})
    : _dataSource = dataSource ?? ApiPresencaDataSource();

  // 👇 2. Trocamos o tipo aqui na variável
  final ApiPresencaDataSource _dataSource;

  Future<List<Presenca>> buscarHistorico() => _dataSource.buscarHistorico();
}