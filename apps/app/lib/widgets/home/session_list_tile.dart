import 'package:flutter/material.dart';

import '../../models/session.dart';

class SessionListTile extends StatelessWidget {
  final Session session;
  final VoidCallback onTap;
  final String subtitle;

  const SessionListTile({
    super.key,
    required this.session,
    required this.onTap,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: colorScheme.secondaryContainer,
        child: Icon(Icons.chat_bubble_outline, color: colorScheme.onSecondaryContainer),
      ),
      title: Text(
        session.title,
        overflow: TextOverflow.ellipsis,
        style: textTheme.titleMedium,
      ),
      subtitle: Text(
        subtitle,
        overflow: TextOverflow.ellipsis,
        style: textTheme.bodySmall?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
      ),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
