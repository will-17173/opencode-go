import 'package:flutter/material.dart';

class ChatAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool isLoading;
  final VoidCallback onStop;

  const ChatAppBar({
    super.key,
    required this.title,
    required this.isLoading,
    required this.onStop,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title, overflow: TextOverflow.ellipsis),
      actions: [
        if (isLoading)
          IconButton(
            icon: const Icon(Icons.stop_circle_outlined),
            onPressed: onStop,
            tooltip: '停止',
          ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
