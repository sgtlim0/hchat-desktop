import type ko from './ko'

const en: Record<keyof typeof ko, string> = {
  // common
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.add': 'Add',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.reset': 'Reset',
  'common.create': 'Create',
  'common.search': 'Search',
  'common.loading': 'Loading...',
  'common.noResults': 'No results found',
  'common.copied': 'Copied',
  'common.copy': 'Copy',
  'common.back': 'Back',
  'common.skipToContent': 'Skip to content',
  'common.connect': 'Connect',
  'common.reconnect': 'Reconnect',
  'common.connected': 'Connected',
  'common.remove': 'Remove',

  // sidebar
  'sidebar.search': 'Search (⌘K)',
  'sidebar.newChat': 'New Chat',
  'sidebar.projects': 'Projects',
  'sidebar.tools': 'Tools',
  'sidebar.groupChat': 'Group Chat',
  'sidebar.memory': 'Memory',
  'sidebar.agentSwarm': 'Agent Swarm',
  'sidebar.scheduler': 'Scheduler',
  'sidebar.favorites': 'Favorites',
  'sidebar.recentChats': 'Recent Chats',
  'sidebar.user': 'Hyundai AutoEver User',
  'sidebar.knowledgeBase': 'Knowledge Base',
  'sidebar.workflow': 'Workflow Builder',
  'sidebar.renamePrompt': 'Rename session',
  'sidebar.deleteConfirm': 'Delete this conversation?',
  'sidebar.rename': 'Rename',
  'sidebar.addFavorite': 'Add to Favorites',
  'sidebar.removeFavorite': 'Remove from Favorites',
  'sidebar.aiTools': 'AI Tools',
  'sidebar.imageGen': 'Image Generation',
  'sidebar.agent': 'AI Agent',
  'sidebar.translate': 'Document Translation',
  'sidebar.promptLibrary': 'Prompt Library',
  'sidebar.debate': 'Model Debate',

  // home
  'home.heading': 'How can I help you?',
  'home.credentialsMissing': 'AWS credentials are not configured.',
  'home.credentialsHint': 'Please enter your AWS Bedrock credentials to start chatting.',
  'home.configure': 'Configure',
  'home.placeholder': 'Type a message...',

  // quick actions
  'quickAction.write': 'Write Code',
  'quickAction.summarize': 'Summarize Document',
  'quickAction.translate': 'Translate',
  'quickAction.brainstorm': 'Brainstorm Ideas',
  'quickAction.review': 'Code Review',
  'quickAction.prompt.write': 'Please write some code. What code do you need?',
  'quickAction.prompt.summarize': 'Please summarize a document. Paste the content to summarize.',
  'quickAction.prompt.translate': 'Please translate. Enter the text to translate.',
  'quickAction.prompt.brainstorm': "Let's brainstorm ideas. What's the topic?",
  'quickAction.prompt.review': 'Please review the code. Paste the code to review.',

  // chat
  'chat.selectOrStart': 'Select a conversation or start a new one',
  'chat.startConversation': 'Start a conversation',
  'chat.placeholder': 'Type a message...',
  'chat.errorOccurred': 'An error occurred: {error}',
  'chat.export': 'Export',
  'chat.exportMarkdown': 'Markdown (.md)',
  'chat.exportHtml': 'HTML (.html)',
  'chat.exportJson': 'JSON (.json)',
  'chat.exportTxt': 'Text (.txt)',
  'chat.exportPdf': 'PDF (.pdf)',
  'chat.favorite': 'Add to favorites',
  'chat.unfavorite': 'Remove from favorites',
  'chat.moreActions': 'More actions',
  'chat.attach': 'Attach file',
  'chat.stop': 'Stop generation',
  'chat.send': 'Send message',
  'chat.deleteChat': 'Delete Chat',
  'chat.waitingResponse': 'Waiting for response...',
  'chat.summarize': 'Summarize',
  'chat.summarizing': 'Generating summary...',
  'chat.summaryGenerated': 'Summary generated',

  // tool calls
  'tool.toolCount': 'Used {count} tools — {status}',
  'tool.running': 'running',
  'tool.allDone': 'all done',
  'tool.statusRunning': 'Running...',
  'tool.statusDone': '— Done',
  'tool.statusError': '— Error',

  // all chats (history)
  'allChats.title': 'All Chats',
  'allChats.searchPlaceholder': 'Search sessions...',
  'allChats.all': 'All',
  'allChats.favorites': 'Favorites',
  'allChats.pinned': 'Pinned',
  'allChats.byProject': 'By Project',
  'allChats.noSessions': 'No sessions',
  'allChats.exportAll': 'Export All',
  'allChats.exported': 'Exported {count} conversations',

  // search
  'search.placeholder': 'Search conversations, projects...',
  'search.conversations': 'Conversations',
  'search.recentConversations': 'Recent Conversations',
  'search.projects': 'Projects',
  'search.messages': 'Messages',
  'search.navigate': 'Navigate',
  'search.open': 'Open',

  // export
  'export.model': 'Model:',
  'export.createdAt': 'Created:',
  'export.updatedAt': 'Modified:',
  'export.tags': 'Tags:',
  'export.attachments': 'Attachments:',

  // session
  'session.newChat': 'New Chat',

  // settings
  'settings.title': 'Settings',
  'settings.tab.apiKeys': 'API Settings',
  'settings.tab.profile': 'Profile',
  'settings.tab.features': 'Features',
  'settings.tab.customization': 'Customization',
  'settings.tab.extensions': 'Extensions',
  'settings.tab.mcp': 'MCP',
  'settings.tab.channels': 'Channels',
  'settings.tab.desktop': 'Desktop',
  'settings.tab.privacy': 'Privacy',
  'settings.tab.developer': 'Developer',
  'settings.tab.usage': 'Usage',
  'settings.tab.personas': 'Personas',
  'settings.notReady': '{tab} settings are not ready yet.',

  // settings - api
  'settings.api.title': 'API Settings',
  'settings.api.description': 'Connect to AI model providers.',
  'settings.api.modelSettings': 'Model Settings',
  'settings.api.defaultModel': 'Default Model',
  'settings.api.autoRouting': 'Auto Routing',
  'settings.api.autoRoutingDesc': 'Automatically selects the best model based on prompt content',
  'settings.api.awsCredentials': 'AWS Credentials',
  'settings.api.secretPlaceholder': 'Enter secret key',
  'settings.api.region': 'Region',
  'settings.api.testing': 'Testing...',
  'settings.api.testConnection': 'Test Connection',
  'settings.api.connectionSuccess': 'Connection successful',
  'settings.api.connectionFailed': 'Connection failed',
  'settings.api.invalidApiKey': 'Invalid API key',
  'settings.api.credentialsNote': 'Credentials are stored in the browser. They are not sent to any external server.',
  'settings.api.openaiNote': 'API key is stored in the browser and connects directly to the OpenAI API.',
  'settings.api.geminiNote': 'API key is stored in the browser and connects directly to the Google API.',

  // settings - customization
  'settings.custom.title': 'Customization',
  'settings.custom.description': 'Configure app appearance.',
  'settings.custom.theme': 'Theme',
  'settings.custom.darkMode': 'Dark Mode',
  'settings.custom.darkModeOn': 'Dark mode is enabled',
  'settings.custom.darkModeOff': 'Light mode is enabled',
  'settings.custom.language': 'Language',
  'settings.custom.languageDesc': 'Select interface language',

  // time
  'time.justNow': 'Just now',
  'time.minutesAgo': '{n}m ago',
  'time.hoursAgo': '{n}h ago',
  'time.daysAgo': '{n}d ago',
  'time.weeksAgo': '{n}w ago',
  'time.monthsAgo': '{n}mo ago',
  'time.yearsAgo': '{n}y ago',
  'time.today': 'Today',
  'time.yesterday': 'Yesterday',
  'time.thisWeek': 'This Week',
  'time.thisMonth': 'This Month',
  'time.earlier': 'Earlier',

  // greetings
  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  'greeting.subtitle': 'Ask me anything',

  // usage
  'usage.title': 'Usage Tracking',
  'usage.description': 'Monitor token usage and estimated costs.',
  'usage.totalCost': 'Total Estimated Cost',
  'usage.totalRequests': '{count} total requests',
  'usage.byModel': 'Usage by Model',
  'usage.noData': 'No usage data yet',
  'usage.model': 'Model',
  'usage.requests': 'Requests',
  'usage.inputTokens': 'Input Tokens',
  'usage.outputTokens': 'Output Tokens',
  'usage.cost': 'Cost',
  'usage.clearAll': 'Clear All',
  'usage.chart.title': 'Cost Trend',
  'usage.chart.daily': 'Daily',
  'usage.chart.weekly': 'Weekly',
  'usage.chart.last30': 'Last 30 Days',

  // prompt library
  'promptLib.title': 'Prompt Library',
  'promptLib.new': 'New Prompt',
  'promptLib.searchPlaceholder': 'Search prompts...',
  'promptLib.empty': 'No saved prompts',
  'promptLib.emptyHint': 'Save and reuse your frequently used prompts.',
  'promptLib.titlePlaceholder': 'Prompt title',
  'promptLib.contentPlaceholder': 'Prompt content (use {{variable}} for variables)',
  'promptLib.tagsPlaceholder': 'Tags (comma separated)',
  'promptLib.use': 'Use',
  'promptLib.apply': 'Apply',
  'promptLib.fillVariables': 'Fill Variables',
  'promptLib.usedCount': 'Used {count} times',
  'promptLib.category.general': 'General',
  'promptLib.category.coding': 'Coding',
  'promptLib.category.writing': 'Writing',
  'promptLib.category.analysis': 'Analysis',
  'promptLib.category.translation': 'Translation',
  'promptLib.category.custom': 'Custom',

  // persona
  'persona.title': 'Persona Management',
  'persona.description': 'Configure AI assistant roles and personalities.',
  'persona.new': 'New Persona',
  'persona.select': 'Select Persona',
  'persona.none': 'Default (No Persona)',
  'persona.preset': 'Preset',
  'persona.namePlaceholder': 'Persona name',
  'persona.descPlaceholder': 'Short description',
  'persona.promptPlaceholder': 'System prompt content',

  // offline
  'offline.banner': 'You are offline. Please check your internet connection.',

  // import
  'import.button': 'Import',
  'import.failed': 'Import failed: {error}',
  'import.success': 'Conversation imported',
  'import.formatDetected': '{format} format detected',

  // tts
  'tts.read': 'Read',
  'tts.stop': 'Stop',

  // stt
  'stt.start': 'Voice input',
  'stt.stop': 'Stop voice input',
  'stt.listening': 'Listening...',

  // thinking depth
  'thinking.fast': 'Fast',
  'thinking.balanced': 'Balanced',
  'thinking.deep': 'Deep',

  // guardrail
  'guardrail.warning': 'Sensitive information detected',
  'guardrail.detected': 'Detected',
  'guardrail.sendAnyway': 'Send anyway',

  // budget
  'budget.warning': 'You have reached {percent}% of your monthly budget',
  'budget.exceeded': 'Monthly budget exceeded!',
  'budget.current': 'Current {current} / {budget}',

  // toast
  'toast.close': 'Close',

  // storage
  'storage.title': 'Storage Management',
  'storage.totalUsed': 'Used',
  'storage.sessions': 'Sessions',
  'storage.messages': 'Messages',
  'storage.clearAll': 'Clear All Data',
  'storage.clearConfirm': 'All conversations and settings will be deleted. Continue?',
  'storage.description': 'Monitor and manage app storage usage.',
  'storage.cleared': 'All data cleared',

  // extension-specific
  'ext.pageContext': 'Page Context',
  'ext.pageContextDesc': 'Send current page content to AI',
  'ext.openSidePanel': 'Open Side Panel',
  'ext.summarizePage': 'Summarize this page',
  'ext.translatePage': 'Translate',
  'ext.askAboutPage': 'Ask H Chat',
  'ext.recentSessions': 'Recent Sessions',
  'ext.noSessions': 'No sessions',
  'ext.connectionStatus': 'Connection Status',
  'ext.connected': 'Connected',
  'ext.disconnected': 'Disconnected',
}

export default en
