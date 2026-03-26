import 'package:flutter/material.dart';

class AppListCard extends StatelessWidget {
  final Widget child;

  const AppListCard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(child: child);
  }
}
