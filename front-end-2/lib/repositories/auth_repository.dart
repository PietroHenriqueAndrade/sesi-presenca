import '../core/network/api_exception.dart';
import '../core/session/session_manager.dart';
import '../core/session/session_state.dart';
import '../data/api/api_auth_data_source.dart';
import '../models/usuario.dart';
import 'auth_exception.dart';

class AuthRepository {
  AuthRepository({ApiAuthDataSource? dataSource, SessionManager? sessionManager})
    : _dataSource = dataSource ?? ApiAuthDataSource(), _sessionManager = sessionManager ?? SessionManager();
  final ApiAuthDataSource _dataSource;
  final SessionManager _sessionManager;

  bool _podeOperarTerminal(Usuario usuario) => const {
    CargoUsuario.coordenador,
    CargoUsuario.professor,
    CargoUsuario.secretaria,
  }.contains(usuario.cargo);

  Future<Usuario> login(String email, String senha) async {
    try {
      final result = await _dataSource.login(email, senha);
      if (!_podeOperarTerminal(result.usuario)) {
        throw const AuthException('Este perfil não possui permissão para operar o terminal de presença.');
      }
      await _sessionManager.save(SessionState(usuario: result.usuario, accessToken: result.accessToken, refreshToken: result.refreshToken, expiresAt: result.expiresAt));
      return result.usuario;
    } on ApiException catch (e) { throw AuthException(e.message); }
  }

  Future<void> recuperarSenha(String email) async {
    try { await _dataSource.recuperarSenha(email); } on ApiException catch (e) { throw AuthException(e.message); }
  }

  Future<void> redefinirSenha({required String email, required String codigo, required String novaSenha}) async {
    try { await _dataSource.redefinirSenha(email: email, codigo: codigo, novaSenha: novaSenha); }
    on ApiException catch (e) { throw AuthException(e.message); }
  }

  Future<Usuario?> restaurarSessao() async {
    final state = _sessionManager.state;
    if (state.usuario == null) return null;
    if (!_podeOperarTerminal(state.usuario!)) {
      await _sessionManager.clear();
      return null;
    }
    if (state.isAuthenticated) return state.usuario;
    if (state.refreshToken == null || state.refreshToken!.isEmpty) {
      await _sessionManager.clear();
      return null;
    }

    try {
      // ApiClient renova silenciosamente o access token antes de /auth/me.
      final usuario = await _dataSource.obterPerfil();
      if (!_podeOperarTerminal(usuario)) {
        await _sessionManager.clear();
        return null;
      }
      final atualizado = _sessionManager.state;
      if (!atualizado.isAuthenticated) return null;
      await _sessionManager.save(SessionState(
        usuario: usuario,
        accessToken: atualizado.accessToken,
        refreshToken: atualizado.refreshToken,
        expiresAt: atualizado.expiresAt,
      ));
      return usuario;
    } on ApiException {
      await _sessionManager.clear();
      return null;
    }
  }

  Future<Usuario> atualizarPerfil({required String nome, required String email}) async {
    try {
      final usuario = await _dataSource.atualizarPerfil(nome: nome, email: email);
      final state = _sessionManager.state;
      await _sessionManager.save(SessionState(usuario: usuario, accessToken: state.accessToken, refreshToken: state.refreshToken, expiresAt: state.expiresAt));
      return usuario;
    } on ApiException catch (e) { throw AuthException(e.message); }
  }

  Future<void> trocarSenha({required String senhaAtual, required String novaSenha}) async {
    try {
      await _dataSource.trocarSenha(senhaAtual: senhaAtual, novaSenha: novaSenha);
      // O backend incrementa tokenVersion, então a sessão atual deixou de ser válida.
      await _sessionManager.clear();
    } on ApiException catch (e) { throw AuthException(e.message); }
  }

  Future<void> sair() async {
    final refresh = _sessionManager.state.refreshToken;
    try {
      if (_sessionManager.state.accessToken?.isNotEmpty ?? false) await _dataSource.logout(refresh);
    } finally { await _sessionManager.clear(); }
  }
}
