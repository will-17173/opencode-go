import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';

import '../providers/chat_provider.dart';
import '../providers/connection_provider.dart';
import '../widgets/chat/chat_app_bar.dart';
import '../widgets/chat/chat_attachment_preview.dart';
import '../widgets/chat/chat_input_bar.dart';
import '../widgets/chat/chat_message_list.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  String? _directory;
  String? _sessionId;
  bool _initialized = false;
  final _imagePicker = ImagePicker();
  List<Map<String, dynamic>> _pendingFiles = [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      _directory = args?['directory'] as String?;
      _sessionId = args?['sessionId'] as String?;

      if (_sessionId != null && _directory != null) {
        _loadHistory();
      }
      _initialized = true;
    }
  }

  Future<void> _loadHistory() async {
    final client = ref.read(apiClientProvider).valueOrNull;
    if (client == null || _sessionId == null || _directory == null) return;

    final messages =
        await client.getSessionMessages(_sessionId!, _directory!);
    ref.read(chatProvider.notifier).setMessages(messages);
  }

  Future<void> _send() async {
    final text = _textController.text.trim();
    if (text.isEmpty && _pendingFiles.isEmpty) return;

    _textController.clear();
    final files = List<Map<String, dynamic>>.from(_pendingFiles);
    setState(() => _pendingFiles = []);

    await ref.read(chatProvider.notifier).sendMessage(
          text: text,
          directory: _directory ?? '',
          files: files,
        );

    _scrollToBottom();
  }

  Future<void> _pickImage() async {
    final xfile = await _imagePicker.pickImage(source: ImageSource.gallery);
    if (xfile == null) return;

    final compressed = await FlutterImageCompress.compressWithFile(
      xfile.path,
      minWidth: 2048,
      minHeight: 2048,
      quality: 82,
      format: CompressFormat.jpeg,
    );
    if (compressed == null) return;

    final base64Data = base64Encode(compressed);
    setState(() {
      _pendingFiles.add({
        'type': 'file',
        'mediaType': 'image/jpeg',
        'filename': '${DateTime.now().millisecondsSinceEpoch}.jpg',
        'url': 'data:image/jpeg;base64,$base64Data',
      });
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);
    final isLoading = ref.watch(chatLoadingProvider);

    ref.listen(chatProvider, (_, __) => _scrollToBottom());

    final l10n = AppLocalizations.of(context)!;
    final dirName = _directory?.split('/').last ?? l10n.chatDefaultTitle;

    return Scaffold(
      appBar: ChatAppBar(
        title: dirName,
        isLoading: isLoading,
        onStop: () => ref.read(chatProvider.notifier).stop(),
      ),
      body: Column(
        children: [
          Expanded(
            child: ChatMessageList(
              messages: messages,
              controller: _scrollController,
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_pendingFiles.isNotEmpty)
                    ChatAttachmentPreview(
                      pendingFiles: _pendingFiles,
                      onRemove: (index) =>
                          setState(() => _pendingFiles.removeAt(index)),
                    ),
                  ChatInputBar(
                    controller: _textController,
                    isLoading: isLoading,
                    onPickImage: _pickImage,
                    onSend: _send,
                    onStop: () => ref.read(chatProvider.notifier).stop(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
