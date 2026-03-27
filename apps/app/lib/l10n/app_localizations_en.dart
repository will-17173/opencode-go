// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'OpenCode Go';

  @override
  String get connectTitle => 'Connection';

  @override
  String get connectSubtitle =>
      'Connect to OpenCode desktop to continue your workspace sessions, history, and streaming responses.';

  @override
  String get connectFormTitle => 'Connection Settings';

  @override
  String get connectFormDesc =>
      'Enter the host info and pairing code from OpenCode desktop.';

  @override
  String get connectLoadingConfig => 'Loading saved connection...';

  @override
  String get connectIpLabel => 'IP Address';

  @override
  String get connectIpHint => 'e.g. 192.168.1.100';

  @override
  String get connectPortLabel => 'Port';

  @override
  String get connectPortHint => '38096';

  @override
  String get connectPairingCode => 'Pairing Code';

  @override
  String get connectPairingCodeHint => '6 digits';

  @override
  String get connectButton => 'Connect to Desktop';

  @override
  String get connectErrorFailed =>
      'Connection failed. Please check IP and port, and ensure OpenCode Go is running.';

  @override
  String get connectErrorCode => 'Invalid pairing code. Please try again.';

  @override
  String get connectErrorNetwork =>
      'Verification failed. Please check your network.';

  @override
  String get homeTitle => 'Workspaces';

  @override
  String get homeSubtitle =>
      'Select a directory from desktop to view history or continue a conversation.';

  @override
  String get homeLoading => 'Syncing workspaces from desktop...';

  @override
  String get homeErrorPrefix => 'Failed to load directories: ';

  @override
  String get homeEmptyTitle => 'No Workspaces';

  @override
  String get homeEmptyMessage =>
      'Start a conversation on desktop first, then the workspace will appear here.';

  @override
  String get sessionTitle => 'History';

  @override
  String get sessionLoading => 'Loading session history...';

  @override
  String get sessionErrorPrefix => 'Failed to load sessions: ';

  @override
  String get sessionEmptyTitle => 'No History';

  @override
  String get sessionEmptyMessage =>
      'No conversations in this workspace yet. Tap the button to start a new chat.';

  @override
  String get sessionNewChat => 'New Chat';

  @override
  String get sessionDeleteNotConnected =>
      'Not connected. Cannot delete session.';

  @override
  String get sessionDeleted => 'Session deleted';

  @override
  String get sessionDeleteFailed => 'Failed to delete session';

  @override
  String get sessionPin => 'Pin';

  @override
  String get sessionUnpin => 'Unpin';

  @override
  String get sessionDelete => 'Delete';

  @override
  String get sessionNoUpdateTime => 'No update time';

  @override
  String get sessionToday => 'Today ';

  @override
  String get sessionYesterday => 'Yesterday';

  @override
  String get chatDefaultTitle => 'Chat';

  @override
  String get chatPlaceholder => 'Send a message...';

  @override
  String get chatSend => 'Send';

  @override
  String get chatAttachImage => 'Add Image';

  @override
  String get chatStop => 'Stop';

  @override
  String get chatLoading => 'Typing...';

  @override
  String get chatEmptyTitle => 'Start New Chat';

  @override
  String get chatEmptyMessage => 'Type a message to start conversation with AI';

  @override
  String get chatPendingAttachments => 'Pending Attachments';

  @override
  String get chatToolCall => 'Tool Call';

  @override
  String get chatToolExecuting => 'Executing';

  @override
  String get chatToolCompleted => 'Completed';

  @override
  String get chatToolFailed => 'Failed';

  @override
  String get chatErrorPrefix => 'Request failed: ';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsLanguageSystem => 'System';

  @override
  String get settingsLanguageZh => '中文';

  @override
  String get settingsLanguageEn => 'English';

  @override
  String get errorConnectionLost => 'Connection lost';

  @override
  String get errorRetry => 'Retry';

  @override
  String get errorLoadFailed => 'Load failed';

  @override
  String get commonLoading => 'Loading...';

  @override
  String get commonUnnamedSession => 'Unnamed Session';
}
