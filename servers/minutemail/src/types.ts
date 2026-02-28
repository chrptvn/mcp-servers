// MinuteMail API entity types

export interface Mailbox {
  id: string;
  alias: string;
  domain: string;
  address: string;
  recoverable: boolean;
  tag: string | null;
  owner: string;
  messageCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface ArchivedMailbox {
  id: string;
  alias: string;
  domain: string;
  address: string;
  tag: string | null;
  owner: string;
  createdAt: string;
}

export interface Message {
  id: string;
  mailboxId: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string;
}

export interface Attachment {
  id: string;
  mailId: string;
  mailboxId: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface AttachmentWithData extends Attachment {
  data: string; // Base64-encoded file content
}

export interface ApiError {
  code: string;
  message: string;
}
