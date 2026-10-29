import 'package:flutter/material.dart';

class SignaturePadController extends ChangeNotifier {
  final List<Offset?> _points = [];

  List<Offset?> get points => List.unmodifiable(_points);
  bool get isEmpty => _points.isEmpty;
  bool get isNotEmpty => _points.isNotEmpty;

  void addPoint(Offset? point) {
    _points.add(point);
    notifyListeners();
  }

  void clear() {
    _points.clear();
    notifyListeners();
  }
}

class SignaturePad extends StatefulWidget {
  final SignaturePadController controller;
  final double height;
  final Color strokeColor;
  final double strokeWidth;

  const SignaturePad({
    super.key,
    required this.controller,
    this.height = 180,
    this.strokeColor = const Color(0xFF60A5FA),
    this.strokeWidth = 2.5,
  });

  @override
  State<SignaturePad> createState() => _SignaturePadState();
}

class _SignaturePadState extends State<SignaturePad> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onControllerChange);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onControllerChange);
    super.dispose();
  }

  void _onControllerChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: widget.controller.isNotEmpty
              ? const Color(0xFF2563EB)
              : Colors.white.withValues(alpha: 0.15),
          width: widget.controller.isNotEmpty ? 1.5 : 1,
        ),
      ),
      child: Stack(
        children: [
          // Background placeholder watermark & signature baseline
          Positioned.fill(
            child: IgnorePointer(
              child: Center(
                child: widget.controller.isEmpty
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.draw_rounded,
                            size: 32,
                            color: Colors.white.withValues(alpha: 0.18),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Chạm và vẽ chữ ký của bạn tại đây',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.3),
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      )
                    : const SizedBox.shrink(),
              ),
            ),
          ),

          // Signature baseline guide
          Positioned(
            left: 20,
            right: 20,
            bottom: 30,
            child: IgnorePointer(
              child: Container(
                height: 1,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),

          // Touch drawing canvas
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: GestureDetector(
              onPanStart: (details) {
                widget.controller.addPoint(details.localPosition);
              },
              onPanUpdate: (details) {
                widget.controller.addPoint(details.localPosition);
              },
              onPanEnd: (_) {
                widget.controller.addPoint(null);
              },
              child: CustomPaint(
                painter: _SignaturePainter(
                  points: widget.controller.points,
                  strokeColor: widget.strokeColor,
                  strokeWidth: widget.strokeWidth,
                ),
                size: Size.infinite,
              ),
            ),
          ),

          // Clear button (top right)
          if (widget.controller.isNotEmpty)
            Positioned(
              top: 8,
              right: 8,
              child: InkWell(
                onTap: () => widget.controller.clear(),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.refresh_rounded, size: 14, color: Color(0xFFEF4444)),
                      SizedBox(width: 4),
                      Text(
                        'Vẽ lại',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFFEF4444),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;
  final Color strokeColor;
  final double strokeWidth;

  _SignaturePainter({
    required this.points,
    required this.strokeColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = strokeColor
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = strokeWidth
      ..isAntiAlias = true;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      } else if (points[i] != null && points[i + 1] == null) {
        canvas.drawCircle(points[i]!, strokeWidth / 2, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => true;
}
