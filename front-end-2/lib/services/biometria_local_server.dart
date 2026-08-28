import 'dart:io';
import 'package:flutter/services.dart';

/// Servidor HTTP loopback embutido no APK. A WebView recebe uma origem
/// localhost confiável para câmera sem depender de Live Server ou adb reverse.
class BiometriaLocalServer {
  HttpServer? _server;

  Uri get uri {
    final server = _server;
    if (server == null) throw StateError('Servidor local ainda não iniciado.');
    return Uri.parse('http://localhost:${server.port}/');
  }

  Future<Uri> start() async {
    if (_server != null) return uri;
    try {
      _server = await HttpServer.bind(InternetAddress.loopbackIPv4, 8765);
    } on SocketException {
      _server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    }
    _server!.listen(_handleRequest);
    return uri;
  }

  Future<void> stop() async {
    final server = _server;
    _server = null;
    await server?.close(force: true);
  }

  Future<void> _handleRequest(HttpRequest request) async {
    final path = request.uri.path;
    if (path == '/' || path == '/index.html') {
      return _serveText(request, 'assets/biometria/index.html', 'text/html; charset=utf-8');
    }
    if (path == '/static/js/app.js' || path == '/app.js') {
      return _serveText(request, 'assets/biometria/app.js', 'application/javascript; charset=utf-8');
    }
    if (path == '/static/css/style.css' || path == '/style.css') {
      return _serveText(request, 'assets/biometria/style.css', 'text/css; charset=utf-8');
    }
    if (path == '/static/img/sesi-logo.png' || path == '/sesi-logo.png') {
      return _serveBytes(request, 'assets/branding/sesi-logo.png', 'image/png');
    }
    request.response.statusCode = HttpStatus.notFound;
    request.response.write('Not found');
    await request.response.close();
  }

  Future<void> _serveText(HttpRequest request, String assetPath, String type) async {
    try {
      final content = await rootBundle.loadString(assetPath);
      request.response.headers.set(HttpHeaders.contentTypeHeader, type);
      request.response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');
      request.response.write(content);
    } catch (_) {
      request.response.statusCode = HttpStatus.internalServerError;
      request.response.write('Falha ao carregar recurso da biometria.');
    } finally {
      await request.response.close();
    }
  }

  Future<void> _serveBytes(HttpRequest request, String assetPath, String type) async {
    try {
      final data = await rootBundle.load(assetPath);
      request.response.headers.set(HttpHeaders.contentTypeHeader, type);
      request.response.headers.set(HttpHeaders.cacheControlHeader, 'public, max-age=86400');
      request.response.add(data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes));
    } catch (_) {
      request.response.statusCode = HttpStatus.internalServerError;
      request.response.write('Falha ao carregar imagem.');
    } finally {
      await request.response.close();
    }
  }
}
