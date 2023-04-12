import User from "../class/user";

interface MessageResponse {
  type: "userNotice" | "gameNotice" | "voteNotice" | "mafiaChat" | "userChat";
  text: string;
  sender: string;
  id: string;
}

interface ServerToClientEvents {
  userListSync: (userList: { nickname: string; imgIdx: number; id: string }[]) => void;
  messageResponse: (response: MessageResponse) => void;
  saveUserInfoResponse: (user: User) => void;
  createRoomResponse: (roomName: string) => void;
  gameReadySync: (userList: { nickname: string; imgIdx: number; id: string }[]) => void;
  timerSync: (ms: number) => void;
  gameSync;
}
