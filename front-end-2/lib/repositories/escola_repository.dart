import '../data/api/api_escola_data_source.dart';
import '../models/horario.dart';
import '../models/notificacao.dart';

class EscolaRepository {
  EscolaRepository({ApiEscolaDataSource? dataSource})
    : _dataSource = dataSource ?? ApiEscolaDataSource();

  final ApiEscolaDataSource _dataSource;

  // 👇 Exigindo e repassando o ID da Turma
  Future<Horario> buscarProximaAula(String turmaId) => 
      _dataSource.buscarProximaAula(turmaId);

  Future<List<Notificacao>> buscarNotificacoes() =>
      _dataSource.listarNotificacoes();
}