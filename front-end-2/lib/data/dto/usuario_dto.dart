import '../../models/usuario.dart';

class UsuarioDto {
  final String id;
  final String nome;
  final String email;
  final String role;
  final bool? ativo;

  const UsuarioDto({
    required this.id,
    required this.nome,
    required this.email,
    required this.role,
    this.ativo,
  });

  factory UsuarioDto.fromJson(Map<String, dynamic> json) => UsuarioDto(
    id: json['id']?.toString() ?? '',
    nome: json['nome'] as String? ?? '',
    email: json['email'] as String? ?? '',
    role: json['role'] as String? ?? 'PROFESSOR',
    ativo: json['ativo'] as bool?,
  );

  Usuario toDomain() => Usuario(
    id: id,
    nome: nome,
    email: email,
    cargo: CargoUsuarioBackend.fromBackend(role),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'nome': nome,
    'email': email,
    'role': role,
    'ativo': ativo,
  };
}
