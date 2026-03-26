import 'package:flutter/material.dart';

import '../../theme/app_spacing.dart';
import '../common/app_list_card.dart';

class ProjectListSection extends StatelessWidget {
  final List<Widget> children;

  const ProjectListSection({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return AppListCard(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.sm,
        ),
        itemCount: children.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) => children[index],
      ),
    );
  }
}
