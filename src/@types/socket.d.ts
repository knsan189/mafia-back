import { GameStatus, Player } from "../class/game.js";
import { Message } from "../utils/messsage.js";
import User from "../class/user.js";

interface ServerToClientEvents {
  error: (message: string) => void;
  messageResponse: (response: Message) => void;
  saveUserInfoResponse: (user: User) => void;
  createRoomResponse: (roomName: string) => void;
  gameStartResponse: (player: Player[]) => void;
  timerSync: (ms: number) => void;
  userListSync: (userList: { nickname: string; imgIdx: number; id: string }[]) => void;
  playerListSync: (players: Player[]) => void;
  gameStatusSync: (status: GameStatus) => void;
  targetPlayerSync: (playerId: Player["id"]) => void;
}
