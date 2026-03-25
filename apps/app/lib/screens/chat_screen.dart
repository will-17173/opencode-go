import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import '../models/message.dart';
import '../providers/chat_provider.dart';
import '../providers/connection_provider.dart';

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
    final client = ref.read(apiClientProvider);
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

    final dirName = _directory?.split('/').last ?? '对话';

    return Scaffold(
      appBar: AppBar(
        title: Text(dirName, overflow: TextOverflow.ellipsis),
        actions: [
          if (isLoading)
            IconButton(
              icon: const Icon(Icons.stop_circle_outlined),
              onPressed: () => ref.read(chatProvider.notifier).stop(),
              tooltip: '停止',
            ),
        ],
      ),
      body: Column(
        children: [
          // 消息列表
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.chat_outlined,
                            size: 56,
                            color: Theme.of(context).colorScheme.outline,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '发送消息开始对话',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.outline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                    itemCount: messages.length,
                    itemBuilder: (context, i) =>
                        _MessageBubble(message: messages[i]),
                  ),
          ),

          // 待发送附件预览
          if (_pendingFiles.isNotEmpty)
            Container(
              height: 80,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).dividerColor,
                  ),
                ),
              ),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _pendingFiles.length,
                itemBuilder: (context, i) {
                  return Stack(
                    children: [
                      Container(
                        margin: const EdgeInsets.all(8),
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          image: DecorationImage(
                            image: MemoryImage(base64Decode(
                              (_pendingFiles[i]['url'] as String)
                                  .split(',')
                                  .last,
                            )),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _pendingFiles.removeAt(i)),
                          child: const CircleAvatar(
                            radius: 10,
                            backgroundColor: Colors.black54,
                            child: Icon(Icons.close,
                                size: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),

          // 输入框区域
          SafeArea(
            top: false,
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).dividerColor,
                  ),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.image_outlined),
                    onPressed: isLoading ? null : _pickImage,
                    tooltip: '添加图片',
                  ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      maxLines: 5,
                      minLines: 1,
                      textInputAction: TextInputAction.newline,
                      decoration: InputDecoration(
                        hintText: '发送消息...',
                        filled: true,
                        fillColor: Theme.of(context)
                            .colorScheme
                            .surfaceContainerHighest,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  isLoading
                      ? IconButton(
                          icon: const Icon(Icons.stop),
                          onPressed: () =>
                              ref.read(chatProvider.notifier).stop(),
                        )
                      : IconButton.filled(
                          icon: const Icon(Icons.send),
                          onPressed: _send,
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

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == MessageRole.user;
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: colorScheme.primary,
              child: const Text('AI',
                  style: TextStyle(fontSize: 9, color: Colors.white)),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isUser
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                // 工具步骤指示器
                if (message.toolSteps.isNotEmpty)
                  _ToolStepsWidget(steps: message.toolSteps),

                // 消息气泡
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.78,
                  ),
                  decoration: BoxDecoration(
                    color: isUser
                        ? colorScheme.primary
                        : colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                  ),
                  child: isUser
                      ? Text(
                          message.textContent,
                          style: TextStyle(color: colorScheme.onPrimary),
                        )
                      : message.isStreaming && message.textContent.isEmpty
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2),
                            )
                          : MarkdownBody(
                              data: message.textContent,
                              selectable: true,
                              styleSheet: MarkdownStyleSheet(
                                p: TextStyle(
                                    color: colorScheme.onSurface,
                                    height: 1.5),
                                code: TextStyle(
                                  backgroundColor:
                                      colorScheme.surfaceContainerLow,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                ),
              ],
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 14,
              backgroundColor: colorScheme.secondary,
              child: const Icon(Icons.person, size: 14),
            ),
          ],
        ],
      ),
    );
  }
}

class _ToolStepsWidget extends StatelessWidget {
  final List<ToolStep> steps;

  const _ToolStepsWidget({required this.steps});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: steps.map((step) {
          final isRunning = step.status == 'running';
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isRunning)
                  const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 1.5),
                  )
                else
                  Icon(
                    step.status == 'error'
                        ? Icons.error_outline
                        : Icons.check_circle_outline,
                    size: 14,
                    color:
                        step.status == 'error' ? Colors.red : Colors.green,
                  ),
                const SizedBox(width: 6),
                Text(
                  step.title,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
