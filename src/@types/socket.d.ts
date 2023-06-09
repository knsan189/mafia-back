import { GameStatus, Player } from "../class/game.js";
import { Message } from "../utils/messsage.js";
import User from "../class/user.js";

interface ServerToClientEvents {
  status: ({ user, room, game }) => void;
  error: (message: string) => void;
  messageResponse: (response: Message) => void;

  /** 사용자 정보 수정 응답 */
  saveUserInfoResponse: (user: User) => void;

  createRoomResponse: (roomName: string) => void;
  gameStartResponse: (player: Player[]) => void;
  playerTargetResponse: (targetId: string) => void;

  timerSync: (ms: number) => void;
  userListSync: (userList: { nickname: string; imgIdx: number; id: string }[]) => void;
  playerListSync: (players: Player[]) => void;
  gameStatusSync: (status: GameStatus) => void;
  targetPlayerSync: (playerId: Player["id"]) => void;
}
