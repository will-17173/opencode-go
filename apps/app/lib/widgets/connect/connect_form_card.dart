import 'package:flutter/material.dart';

import '../../theme/app_spacing.dart';
import '../common/app_section.dart';

class ConnectFormCard extends StatelessWidget {
  final List<Widget> children;

  const ConnectFormCard({
    super.key,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: AppSpacing.cardContentPadding,
        child: AppSection(
          title: '连接设置',
          description: '输入桌面端 OpenCode 的主机信息与配对码。',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: children,
          ),
        ),
      ),
    );
  }
}
