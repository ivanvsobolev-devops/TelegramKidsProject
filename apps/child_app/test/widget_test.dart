import 'package:flutter_test/flutter_test.dart';
import 'package:telegram_kids_child_app/main.dart';

void main() {
  testWidgets('renders child app shell', (tester) async {
    await tester.pumpWidget(const TelegramKidsChildApp());

    expect(find.text('Telegram Kids Child App'), findsOneWidget);
  });
}
