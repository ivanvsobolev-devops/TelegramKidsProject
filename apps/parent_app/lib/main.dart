import 'package:flutter/material.dart';

void main() {
  runApp(const TelegramKidsParentApp());
}

class TelegramKidsParentApp extends StatelessWidget {
  const TelegramKidsParentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Telegram Kids Parent',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Text('Telegram Kids Parent App'),
        ),
      ),
    );
  }
}
