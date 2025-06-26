export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  contextLength: number;
  supportsVision?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  images?: string[];
  files?: FileAttachment[];
  isError?: boolean;
  imageUrl?: string; // For backward compatibility
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
}

export interface APIKeyConfig {
  openRouterKey: string;
}