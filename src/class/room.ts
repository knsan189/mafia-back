interface RoomInterface {
  roomName: string;
  status: "idle" | "play";
  userList: { id: User["socketId"]; isReady: boolean }[];
}

export default class Room implements RoomInterface {
  roomName: string;

  status: "idle" | "play";

  userList: { id: string; isReady: boolean }[];

  constructor(roomName: string) {
    this.userList = [];
    this.status = "idle";
    this.roomName = roomName;
  }
}
