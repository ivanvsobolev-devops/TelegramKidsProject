import 'package:flutter/material.dart';

void main() {
  runApp(const TelegramKidsChildApp());
}

class TelegramKidsChildApp extends StatelessWidget {
  const TelegramKidsChildApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Telegram Kids',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Text('Telegram Kids Child App'),
        ),
      ),
    );
  }
}
