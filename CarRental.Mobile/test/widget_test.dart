import 'package:flutter_test/flutter_test.dart';
import 'package:car_rental_mobile/main.dart';

void main() {
  testWidgets('Velora app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const VeloraCarRentalApp());
    expect(find.byType(VeloraCarRentalApp), findsOneWidget);
    // Advance time past the splash timer
    await tester.pump(const Duration(milliseconds: 1500));
    // Verify transition has begun or widget tree rendered
    await tester.pump();
  });
}
