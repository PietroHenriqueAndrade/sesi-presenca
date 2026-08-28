import '../../core/network/api_client.dart';
import '../../models/usuario.dart';

class AuthResult {
  final Usuario usuario;
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
  AuthResult({required this.usuario, required this.accessToken, required this.refreshToken, required this.expiresAt});
}

class ApiAuthDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<AuthResult> login(String email, String senha) async {
    final res = await _apiClient.post('/auth/login', body: {'email': email, 'senha': senha});
    final data = Map<String, dynamic>.from(res['data'] as Map);
    return AuthResult(
      usuario: Usuario.fromJson(Map<String, dynamic>.from(data['usuario'] as Map)),
      accessToken: data['token']?.toString() ?? '',
      refreshToken: data['refreshToken']?.toString() ?? '',
      expiresAt: DateTime.tryParse(data['expiresAt']?.toString() ?? '') ?? DateTime.now().add(const Duration(hours: 1)),
    );
  }

  Future<void> recuperarSenha(String email) async => _apiClient.post('/auth/recuperar-senha', body: {'email': email});
  Future<void> redefinirSenha({required String email, required String codigo, required String novaSenha}) async =>
      _apiClient.post('/auth/redefinir-senha', body: {'email': email, 'codigo': codigo, 'novaSenha': novaSenha});

  Future<Usuario> obterPerfil() async {
    final res = await _apiClient.get('/auth/me');
    return Usuario.fromJson(Map<String, dynamic>.from(res['data'] as Map));
  }

  Future<Usuario> atualizarPerfil({required String nome, required String email}) async {
    final res = await _apiClient.patch('/usuarios/me', body: {'nome': nome, 'email': email});
    return Usuario.fromJson(Map<String, dynamic>.from(res['data'] as Map));
  }

  Future<void> trocarSenha({required String senhaAtual, required String novaSenha}) async =>
      _apiClient.post('/auth/trocar-senha', body: {'senhaAtual': senhaAtual, 'novaSenha': novaSenha});

  Future<void> logout(String? refreshToken) async => _apiClient.post('/auth/logout', body: {'refreshToken': refreshToken});
}
