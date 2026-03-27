import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

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
    final l10n = AppLocalizations.of(context)!;
    return AppBar(
      title: Text(title, overflow: TextOverflow.ellipsis),
      actions: [
        if (isLoading)
          IconButton(
            icon: const Icon(Icons.stop_circle_outlined),
            onPressed: onStop,
            tooltip: l10n.chatStop,
          ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
