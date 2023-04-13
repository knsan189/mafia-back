import io from "../socket.js";
import User from "./user.js";

export type MessageType = "userNotice" | "gameNotice" | "voteNotice" | "mafiaChat" | "userChat";

export interface MessageConstructor {
  type?: MessageType;
  sender?: "system" | User["id"];
  text: string;
}

export default class Message {
  type: MessageType;

  text: string;

  sender: string;

  id: string;

  timestamp: string;

  constructor({ type = "userNotice", text, sender = "system" }: MessageConstructor) {
    const timestamp = new Date();
    this.id = timestamp.getTime().toString();
    this.timestamp = timestamp.toString();
    this.type = type;
    this.text = text;
    this.sender = sender;
  }

  send(roomName: string) {
    io.to(roomName).emit("messageResponse", this);
  }
}
