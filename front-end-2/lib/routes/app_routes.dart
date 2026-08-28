import 'package:flutter/material.dart';

import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/recognition/reconhecimento_web_screen.dart';
import '../screens/splash/splash_screen.dart';

/// O aplicativo mobile é deliberadamente um terminal: autenticação e biometria.
/// Administração, cadastros e relatórios ficam no Dashboard React.
class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String login = '/login';
  static const String esqueciSenha = '/esqueci-senha';
  static const String reconhecimento = '/reconhecimento';

  // Mantidos como aliases para código legado que eventualmente ainda importe
  // as constantes, mas não são destinos do fluxo principal.
  static const String dashboard = reconhecimento;
  static const String home = reconhecimento;

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _fade(const SplashScreen(), settings);
      case login:
        return _fade(const LoginScreen(), settings);
      case esqueciSenha:
        return _slide(const ForgotPasswordScreen(), settings);
      case reconhecimento:
        return _fade(const ReconhecimentoWebScreen(), settings);
      default:
        return _fade(const LoginScreen(), settings);
    }
  }

  static PageRouteBuilder _fade(Widget page, RouteSettings settings) =>
      PageRouteBuilder(
        settings: settings,
        transitionDuration: const Duration(milliseconds: 260),
        pageBuilder: (_, __, ___) => page,
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
      );

  static PageRouteBuilder _slide(Widget page, RouteSettings settings) =>
      PageRouteBuilder(
        settings: settings,
        transitionDuration: const Duration(milliseconds: 280),
        pageBuilder: (_, __, ___) => page,
        transitionsBuilder: (_, animation, __, child) => SlideTransition(
          position: Tween<Offset>(begin: const Offset(0.05, 0), end: Offset.zero)
              .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
          child: FadeTransition(opacity: animation, child: child),
        ),
      );
}
