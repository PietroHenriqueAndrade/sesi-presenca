import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_face/core/session/session_manager.dart';
import 'package:tcc_face/core/session/session_state.dart';
import 'package:tcc_face/models/usuario.dart';

class MemorySessionStorage implements SessionStorage {
  final Map<String, String> values = {};

  @override
  Future<void> delete(String key) async {
    values.remove(key);
  }

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late MemorySessionStorage storage;

  setUp(() async {
    storage = MemorySessionStorage();
    SessionManager().useStorageForTesting(storage);
    await SessionManager().clear();
  });

  test('SessionManager é singleton e compartilha a mesma sessão', () async {
    final a = SessionManager();
    final b = SessionManager();

    await a.save(SessionState(
      usuario: const Usuario(
        id: 'u1',
        nome: 'Admin',
        email: 'admin@senai.br',
        cargo: CargoUsuario.coordenador,
      ),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: DateTime.now().add(const Duration(hours: 1)),
    ));

    expect(identical(a, b), isTrue);
    expect(b.state.accessToken, 'access-token');
    expect(b.state.isAuthenticated, isTrue);
  });

  test('restore recupera sessão persistida', () async {
    final expiresAt = DateTime.now().add(const Duration(hours: 1));
    storage.values.addAll({
      'session_usuario': '{"id":"u1","nome":"Secretaria","email":"sec@senai.br","role":"SECRETARIA"}',
      'session_access_token': 'token-1',
      'session_refresh_token': 'refresh-1',
      'session_expires_at': expiresAt.toIso8601String(),
    });

    final manager = SessionManager();
    await manager.restore();

    expect(manager.state.usuario?.cargo, CargoUsuario.secretaria);
    expect(manager.state.accessToken, 'token-1');
    expect(manager.state.refreshToken, 'refresh-1');
    expect(manager.state.isAuthenticated, isTrue);
  });

  test('clear remove tokens e autenticação', () async {
    final manager = SessionManager();
    await manager.save(SessionState(
      usuario: const Usuario(id: 'u1', nome: 'Admin', email: 'a@b.com', cargo: CargoUsuario.coordenador),
      accessToken: 'token',
      expiresAt: DateTime.now().add(const Duration(hours: 1)),
    ));
    await manager.clear();
    expect(manager.state.isAuthenticated, isFalse);
    expect(manager.state.accessToken, isNull);
    expect(storage.values, isEmpty);
  });
}
