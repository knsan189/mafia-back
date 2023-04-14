import io from "../socket.js";

export type MessageType = "userNotice" | "gameNotice" | "voteNotice" | "mafiaChat" | "userChat";

export interface MessageConstructor {
  type?: MessageType;
  sender?: string;
  text: string;
}

export interface Message {
  type: MessageType;
  text: string;
  sender: string;
  id: string;
  timestamp: string;
}

export function sendMessage(
  roomName: string,
  { type = "userNotice", text, sender = "system" }: MessageConstructor,
) {
  const timestamp = new Date();
  const id = Math.floor(Math.random() * 1000 + timestamp.getTime()).toString();

  io.to(roomName).emit("messageResponse", {
    type,
    text,
    sender,
    timestamp: timestamp.toLocaleString(),
    id,
  });
}

export default {};
