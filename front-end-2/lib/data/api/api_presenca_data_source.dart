import '../../core/network/api_client.dart';
import '../../core/network/api_payload.dart';
import '../../models/presenca.dart';

class ApiPresencaDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<List<Presenca>> buscarHistorico() async {
    const limite = 100;
    var pagina = 1;
    var totalPaginas = 1;
    final registros = <Presenca>[];

    do {
      final res = await _apiClient.get(
        '/presencas',
        query: {'page': pagina, 'limit': limite},
      );

      final lista = ApiPayload.list(res);
      registros.addAll(
        lista.whereType<Map>().map(
          (e) => Presenca.fromJson(Map<String, dynamic>.from(e)),
        ),
      );

      final data = res['data'];
      if (data is Map && data['meta'] is Map) {
        final meta = data['meta'] as Map;
        totalPaginas = (meta['totalPaginas'] as num?)?.toInt() ?? 1;
      }
      pagina += 1;
    } while (pagina <= totalPaginas);

    return registros;
  }
}
