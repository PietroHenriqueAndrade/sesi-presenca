import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_face/core/network/api_exception.dart';
import 'package:tcc_face/core/network/api_payload.dart';

void main() {
  group('ApiPayload', () {
    test('aceita lista direta em data', () {
      final itens = ApiPayload.list({'data': [{'id': '1'}, {'id': '2'}]});
      expect(itens, hasLength(2));
    });

    test('aceita lista paginada em data.dados', () {
      final itens = ApiPayload.list({
        'data': {
          'dados': [{'id': '1'}],
          'meta': {'totalPaginas': 1},
        },
      });
      expect((itens.single as Map)['id'], '1');
    });

    test('falha de forma explícita em contrato inválido', () {
      expect(() => ApiPayload.list({'data': {'meta': {}}}), throwsA(isA<ApiException>()));
    });

    test('extrai objeto de data', () {
      expect(ApiPayload.object({'data': {'id': 'abc'}})['id'], 'abc');
    });
  });
}
