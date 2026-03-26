import 'package:flutter/material.dart';

import '../../theme/app_spacing.dart';

class AppScaffold extends StatelessWidget {
  final PreferredSizeWidget? appBar;
  final Widget child;
  final Widget? floatingActionButton;
  final bool useSafeArea;
  final EdgeInsetsGeometry? padding;
  final ScrollController? scrollController;

  const AppScaffold({
    super.key,
    this.appBar,
    required this.child,
    this.floatingActionButton,
    this.useSafeArea = true,
    this.padding,
    this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    final body = Align(
      alignment: Alignment.topCenter,
      child: SingleChildScrollView(
        controller: scrollController,
        padding: padding ?? AppSpacing.pagePadding,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: child,
        ),
      ),
    );

    return Scaffold(
      appBar: appBar,
      floatingActionButton: floatingActionButton,
      body: useSafeArea ? SafeArea(child: body) : body,
    );
  }
}
