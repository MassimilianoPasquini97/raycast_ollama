export interface Preferences {
  ollamaResultViewInput: string;
  ollamaResultViewInputFallback: boolean;
  ollamaChatHistoryMessagesNumber: string;
  ollamaCertificateValidation: string;
}

export interface RaycastArgumentsOllamaCommandCustom {
  fallbackText?: string;
  arguments: {
    prompt: string;
    server: string;
    model: string;
    creativity: string;
  };
  launchType: string;
  launchContext?: string;
}

export interface RaycastArgumentsOllamaCommandTranslate {
  fallbackText?: string;
  arguments: {
    language: string;
  };
  launchType: string;
  launchContext?: string;
}

export interface RaycastImage {
  path: string;
  html: string;
  base64: string;
}
