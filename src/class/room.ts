interface RoomInterface {
  roomName: string;
  status: "idle" | "play";
  userList: { id: User["socketId"]; isReady: boolean }[];
}

export default class Room implements RoomInterface {
  roomName: string;

  status: "idle" | "play";

  userList: { id: string; isReady: boolean }[];

  constructor() {
    this.userList = [];
    this.status = "idle";
    this.roomName = Math.floor(Math.random() * 1000 + new Date().getTime()).toString();
  }

  addUser(id: string) {
    this.userList = [...this.userList, { id, isReady: false }];
  }

  editUser(id: string, isReady: boolean) {
    this.userList = this.userList.map((user) => (user.id !== id ? user : { ...user, isReady }));
  }

  removeUser(id: string) {
    this.userList = this.userList.filter((user) => user.id !== id);
  }
}
