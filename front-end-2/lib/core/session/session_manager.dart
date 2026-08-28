import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../models/usuario.dart';
import 'session_state.dart';

abstract class SessionStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class SecureSessionStorage implements SessionStorage {
  SecureSessionStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) => _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}

/// Fonte única da sessão do aplicativo.
///
/// Tokens são persistidos no armazenamento seguro do sistema operacional.
/// SharedPreferences é lido apenas uma vez para migrar sessões de versões antigas.
class SessionManager {
  SessionManager._internal();

  static final SessionManager _instance = SessionManager._internal();

  factory SessionManager() => _instance;

  static const _usuarioKey = 'session_usuario';
  static const _accessTokenKey = 'session_access_token';
  static const _refreshTokenKey = 'session_refresh_token';
  static const _expiresAtKey = 'session_expires_at';
  static const _keys = [_usuarioKey, _accessTokenKey, _refreshTokenKey, _expiresAtKey];

  SessionStorage _storage = SecureSessionStorage();
  SessionState _state = const SessionState();
  bool _skipLegacyStorage = false;

  SessionState get state => _state;

  /// Permite testes unitários sem acessar o KeyStore/Keychain.
  void useStorageForTesting(SessionStorage storage) {
    _storage = storage;
    _state = const SessionState();
    _skipLegacyStorage = true;
  }

  Future<void> restore() async {
    await _migrateLegacySharedPreferences();

    final usuarioJson = await _storage.read(_usuarioKey);
    final accessToken = await _storage.read(_accessTokenKey);
    final refreshToken = await _storage.read(_refreshTokenKey);
    final expiresAtRaw = await _storage.read(_expiresAtKey);

    if (usuarioJson == null || accessToken == null || accessToken.isEmpty) {
      _state = const SessionState();
      return;
    }

    try {
      final decoded = jsonDecode(usuarioJson);
      if (decoded is! Map<String, dynamic>) {
        await clear();
        return;
      }

      final restored = SessionState(
        usuario: Usuario.fromJson(decoded),
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAtRaw == null ? null : DateTime.tryParse(expiresAtRaw),
      );

      if (restored.isExpired && (refreshToken == null || refreshToken.isEmpty)) {
        await clear();
        return;
      }

      _state = restored;
    } catch (_) {
      await clear();
    }
  }

  Future<void> save(SessionState state) async {
    _state = state;
    final usuario = state.usuario;

    if (usuario != null) {
      await _storage.write(_usuarioKey, jsonEncode(usuario.toJson()));
    } else {
      await _storage.delete(_usuarioKey);
    }

    await _writeNullable(_accessTokenKey, state.accessToken);
    await _writeNullable(_refreshTokenKey, state.refreshToken);
    await _writeNullable(_expiresAtKey, state.expiresAt?.toIso8601String());
  }

  Future<void> clear() async {
    _state = const SessionState();
    for (final key in _keys) {
      await _storage.delete(key);
    }

    // Remove também qualquer sessão insegura deixada por APKs antigos.
    if (!_skipLegacyStorage) {
      final prefs = await SharedPreferences.getInstance();
      for (final key in _keys) {
        await prefs.remove(key);
      }
    }
  }

  Future<void> _writeNullable(String key, String? value) async {
    if (value == null || value.isEmpty) {
      await _storage.delete(key);
    } else {
      await _storage.write(key, value);
    }
  }

  Future<void> _migrateLegacySharedPreferences() async {
    if (_skipLegacyStorage || await _storage.read(_accessTokenKey) != null) return;

    final prefs = await SharedPreferences.getInstance();
    var migrated = false;
    for (final key in _keys) {
      final value = prefs.getString(key);
      if (value != null && value.isNotEmpty) {
        await _storage.write(key, value);
        migrated = true;
      }
    }

    if (migrated) {
      for (final key in _keys) {
        await prefs.remove(key);
      }
    }
  }
}
