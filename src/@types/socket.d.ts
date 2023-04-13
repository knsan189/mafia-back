import { Player } from "../class/game.js";
import Message from "../class/messsage.js";
import User from "../class/user.js";

interface ServerToClientEvents {
  messageResponse: (response: Message) => void;
  saveUserInfoResponse: (user: User) => void;
  createRoomResponse: (roomName: string) => void;
  gameStartResponse: (player: Player[]) => void;
  timerSync: (ms: number) => void;
  userListSync: (userList: { nickname: string; imgIdx: number; id: string }[]) => void;
  playerListSync: (players: Player[]) => void;
}
