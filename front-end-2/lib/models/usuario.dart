/// Perfil do usuário autenticado, alinhado ao enum Role do backend.
enum CargoUsuario { coordenador, professor, secretaria, cozinha, sistemaIa, desconhecido }

extension CargoUsuarioLabel on CargoUsuario {
  String get label => switch (this) {
    CargoUsuario.coordenador => 'Administrador(a)',
    CargoUsuario.professor => 'Professor(a)',
    CargoUsuario.secretaria => 'Secretaria',
    CargoUsuario.cozinha => 'Cozinha',
    CargoUsuario.sistemaIa => 'Sistema IA',
    CargoUsuario.desconhecido => 'Usuário',
  };
}

extension CargoUsuarioBackend on CargoUsuario {
  String get backendValue => switch (this) {
    CargoUsuario.coordenador => 'ADMIN',
    CargoUsuario.professor => 'PROFESSOR',
    CargoUsuario.secretaria => 'SECRETARIA',
    CargoUsuario.cozinha => 'COZINHA',
    CargoUsuario.sistemaIa => 'SISTEMA_IA',
    CargoUsuario.desconhecido => '',
  };

  static CargoUsuario fromBackend(String? value) => switch (value?.toUpperCase()) {
    'ADMIN' => CargoUsuario.coordenador,
    'PROFESSOR' => CargoUsuario.professor,
    'SECRETARIA' => CargoUsuario.secretaria,
    'COZINHA' => CargoUsuario.cozinha,
    'SISTEMA_IA' => CargoUsuario.sistemaIa,
    _ => CargoUsuario.desconhecido,
  };
}

class Usuario {
  final String id;
  final String nome;
  final String email;
  final CargoUsuario cargo;

  const Usuario({required this.id, required this.nome, required this.email, required this.cargo});

  String get iniciais {
    final partes = nome.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (partes.isEmpty) return '?';
    if (partes.length == 1) return partes.first[0].toUpperCase();
    return (partes.first[0] + partes.last[0]).toUpperCase();
  }

  Usuario copyWith({String? id, String? nome, String? email, CargoUsuario? cargo}) => Usuario(
    id: id ?? this.id, nome: nome ?? this.nome, email: email ?? this.email, cargo: cargo ?? this.cargo,
  );

  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
    id: json['id']?.toString() ?? '',
    nome: json['nome']?.toString() ?? '',
    email: json['email']?.toString() ?? '',
    cargo: CargoUsuarioBackend.fromBackend((json['cargo'] ?? json['role'])?.toString()),
  );

  Map<String, dynamic> toJson() => {'id': id, 'nome': nome, 'email': email, 'role': cargo.backendValue};
}
