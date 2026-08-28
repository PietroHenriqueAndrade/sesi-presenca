/// Erro de autenticação lançado pelo [AuthRepository].
class AuthException implements Exception {
  final String mensagem;
  const AuthException(this.mensagem);

  @override
  String toString() => mensagem;
}
