interface User {
  socketId: string;
  nickname?: string;
  imgIdx: number;
  currentRoomName: Room["roomName"];
}

interface UserInterface {
  socketId: string;
  nickname?: string;
  imgIdx: number;
  currentRoomName: Room["roomName"];
}

interface Room {
  roomName: string;
  status: "idle" | "play";
  userList: { id: User["socketId"]; isReady: boolean }[];
}

interface MessageRequest {
  text: string;
  receiver?: string;
}
