import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_face/models/presenca.dart';

void main() {
  group('Presenca.fromJson', () {
    test('interpreta contrato real do backend com aluno e turma aninhados', () {
      final presenca = Presenca.fromJson({
        'id': 'p1',
        'status': 'ATRASO',
        'dataHora': '2026-08-24T10:15:00.000Z',
        'dataHoraSaida': '2026-08-24T16:00:00.000Z',
        'aluno': {'id': 'a1', 'nome': 'Neil Lopes', 'matricula': '123'},
        'turma': {'id': 't1', 'nome': '3 DS'},
      });

      expect(presenca.status, StatusPresenca.atrasado);
      expect(presenca.aluno.nome, 'Neil Lopes');
      expect(presenca.aluno.turma, '3 DS');
      expect(presenca.aluno.turmaId, 't1');
      expect(presenca.saida, isNotNull);
    });

    test('mapeia ausência justificada sem transformá-la em presente', () {
      final presenca = Presenca.fromJson({
        'id': 'p2',
        'status': 'JUSTIFICADO',
        'dataHora': '2026-08-24T10:15:00.000Z',
        'aluno': {'id': 'a1', 'nome': 'Aluno', 'matricula': '123'},
      });
      expect(presenca.status, StatusPresenca.justificado);
      expect(presenca.status.backendValue, 'JUSTIFICADO');
    });

    test('mapeia todos os status do backend', () {
      expect(StatusPresencaBackend.fromBackend('PRESENTE'), StatusPresenca.presente);
      expect(StatusPresencaBackend.fromBackend('ATRASO'), StatusPresenca.atrasado);
      expect(StatusPresencaBackend.fromBackend('AUSENTE'), StatusPresenca.ausente);
      expect(StatusPresencaBackend.fromBackend('JUSTIFICADO'), StatusPresenca.justificado);
      expect(StatusPresencaBackend.fromBackend('SAIDA_ANTECIPADA'), StatusPresenca.saidaAntecipada);
    });
  });
}
