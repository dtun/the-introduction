export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  sender: "user" | "system";
}

export type MessageSender = Message["sender"];
