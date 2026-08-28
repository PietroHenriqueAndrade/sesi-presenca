import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../../core/network/api_config.dart';
import '../../core/session/session_manager.dart';
import '../../core/theme/app_colors.dart';
import '../../models/usuario.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/biometria_local_server.dart';

class ReconhecimentoWebScreen extends StatefulWidget {
  const ReconhecimentoWebScreen({super.key});

  @override
  State<ReconhecimentoWebScreen> createState() => _ReconhecimentoWebScreenState();
}

class _ReconhecimentoWebScreenState extends State<ReconhecimentoWebScreen> {
  final BiometriaLocalServer _localServer = BiometriaLocalServer();
  final SessionManager _sessionManager = SessionManager();
  WebViewController? _controller;
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _inicializar();
  }

  Future<void> _inicializar() async {
    if (mounted) {
      setState(() {
        _carregando = true;
        _erro = null;
      });
    }

    final status = await Permission.camera.request();
    if (!mounted) return;
    if (!status.isGranted) {
      setState(() {
        _carregando = false;
        _erro = 'A permissão da câmera é obrigatória para registrar presença.';
      });
      return;
    }

    try {
      final localUri = await _localServer.start();
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..addJavaScriptChannel('FlutterBiometria', onMessageReceived: _onJavaScriptMessage)
        ..setNavigationDelegate(NavigationDelegate(
          onNavigationRequest: (request) {
            final destino = Uri.tryParse(request.url);
            final mesmaOrigemLocal = destino != null &&
                destino.scheme == localUri.scheme &&
                destino.host == localUri.host &&
                destino.port == localUri.port;
            return mesmaOrigemLocal
                ? NavigationDecision.navigate
                : NavigationDecision.prevent;
          },
          onPageFinished: (_) async {
            await _injetarConfiguracaoWeb();
            if (mounted) setState(() => _carregando = false);
          },
          onWebResourceError: (error) {
            if (!mounted || error.isForMainFrame == false) return;
            setState(() {
              _carregando = false;
              _erro = 'Falha ao abrir o terminal de biometria: ${error.description}';
            });
          },
        ));

      if (controller.platform is AndroidWebViewController) {
        final android = controller.platform as AndroidWebViewController;
        if (kDebugMode) AndroidWebViewController.enableDebugging(true);
        android.setMediaPlaybackRequiresUserGesture(false);
        android.setOnPlatformPermissionRequest((request) => request.grant());
      }

      if (!mounted) return;
      setState(() => _controller = controller);
      await controller.loadRequest(localUri);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _carregando = false;
        _erro = 'Não foi possível iniciar a biometria: $error';
      });
    }
  }

  Future<void> _injetarConfiguracaoWeb() async {
    final controller = _controller;
    if (controller == null) return;
    final state = _sessionManager.state;
    await controller.runJavaScript('''
      // Token fica somente em memória na WebView; remove resíduos de APKs antigos.
      localStorage.removeItem('token');
      window.__TCC_CONFIG__ = Object.freeze({
        token: ${jsonEncode(state.accessToken ?? '')},
        nodeApiBase: ${jsonEncode(ApiConfig.nodeApiBaseUrl)},
        pythonApiBase: ${jsonEncode(ApiConfig.pythonBaseUrl)},
        userRole: ${jsonEncode(state.usuario?.cargo.backendValue ?? '')},
        userName: ${jsonEncode(state.usuario?.nome ?? 'Operador autorizado')},
      });
      window.dispatchEvent(new Event('flutter-config-updated'));
    ''');
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
  }

  void _onJavaScriptMessage(JavaScriptMessage message) {
    try {
      final decoded = jsonDecode(message.message);
      if (decoded is! Map) return;
      final payload = Map<String, dynamic>.from(decoded);
      switch (payload['evento']?.toString()) {
        case 'presenca_processada':
          // Não fechamos a rota após a presença. Esta tela É o terminal principal e deve
          // continuar aberta para o próximo aluno. Isso elimina a tela preta
          // observada após um reconhecimento bem-sucedido.
          return;
        case 'logout_solicitado':
        case 'sessao_expirada':
          _logout();
          return;
      }
    } catch (_) {
      // Mensagens desconhecidas não derrubam o terminal.
    }
  }

  @override
  void dispose() {
    _localServer.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              if (_controller != null && _erro == null)
                Positioned.fill(child: WebViewWidget(controller: _controller!)),
              if (_erro != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 460),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.asset('assets/branding/sesi-logo.png', width: 180),
                          const SizedBox(height: 28),
                          const Icon(Icons.camera_alt_outlined, color: AppColors.primary, size: 54),
                          const SizedBox(height: 15),
                          Text(_erro!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, height: 1.45)),
                          const SizedBox(height: 22),
                          FilledButton(onPressed: _inicializar, child: const Text('Tentar novamente')),
                          const SizedBox(height: 8),
                          TextButton(onPressed: _logout, child: const Text('Sair da conta')),
                        ],
                      ),
                    ),
                  ),
                ),
              if (_carregando && _erro == null)
                const Positioned.fill(
                  child: ColoredBox(
                    color: Colors.white,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(color: AppColors.primary),
                          SizedBox(height: 16),
                          Text('Preparando câmera e reconhecimento...', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
