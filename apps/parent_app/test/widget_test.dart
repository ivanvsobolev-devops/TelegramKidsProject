import 'package:flutter_test/flutter_test.dart';
import 'package:telegram_kids_parent_app/main.dart';

void main() {
  testWidgets('renders parent app shell', (tester) async {
    await tester.pumpWidget(const TelegramKidsParentApp());

    expect(find.text('Telegram Kids Parent App'), findsOneWidget);
  });
}
