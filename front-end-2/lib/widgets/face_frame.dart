import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Círculo de enquadramento facial animado (simulação da câmera).
///
/// Desenha um anel pontilhado com um arco giratório enquanto o
/// reconhecimento está "processando", reproduzindo o visual de scanners
/// biométricos sem utilizar a câmera real.
class FaceFrame extends StatefulWidget {
  final double size;
  final bool processando;

  const FaceFrame({super.key, this.size = 260, this.processando = false});

  @override
  State<FaceFrame> createState() => _FaceFrameState();
}

class _FaceFrameState extends State<FaceFrame>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => SizedBox(
        width: widget.size,
        height: widget.size,
        child: CustomPaint(
          painter: _FaceFramePainter(
            progresso: _controller.value,
            processando: widget.processando,
          ),
          child: Center(
            child: Icon(
              Icons.face_outlined,
              size: widget.size * 0.42,
              color: Colors.white.withValues(alpha: 0.35),
            ),
          ),
        ),
      ),
    );
  }
}

class _FaceFramePainter extends CustomPainter {
  final double progresso;
  final bool processando;

  _FaceFramePainter({required this.progresso, required this.processando});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final raio = size.width / 2 - 6;

    // Anel pontilhado de enquadramento.
    final pontilhado = Paint()
      ..color = Colors.white.withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    const int tracos = 40;
    for (int i = 0; i < tracos; i++) {
      final inicio = (i / tracos) * 2 * math.pi;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: raio),
        inicio,
        (2 * math.pi / tracos) * 0.55,
        false,
        pontilhado,
      );
    }

    // Arco giratório (feedback de leitura/processamento).
    final arco = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 5
      ..shader = SweepGradient(
        startAngle: 0,
        endAngle: 2 * math.pi,
        colors: [
          AppColors.primaryLight.withValues(alpha: 0),
          AppColors.primaryLight,
        ],
        transform: GradientRotation(progresso * 2 * math.pi),
      ).createShader(Rect.fromCircle(center: center, radius: raio));

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: raio),
      progresso * 2 * math.pi,
      processando ? math.pi * 1.2 : math.pi * 0.5,
      false,
      arco,
    );
  }

  @override
  bool shouldRepaint(_FaceFramePainter oldDelegate) =>
      oldDelegate.progresso != progresso ||
      oldDelegate.processando != processando;
}
