import io, { RoomMap, UserMap } from "../socket.js";
import Message from "./messsage.js";

interface RoomInterface {
  roomName: string;
  status: "idle" | "play";
  userList: { id: User["socketId"]; isReady: boolean }[];
}

export default class Room implements RoomInterface {
  roomName: string;

  status: "idle" | "play" = "idle";

  userList: { id: string; isReady: boolean }[] = [];

  constructor() {
    this.roomName = Math.floor(Math.random() * 1000 + new Date().getTime()).toString();
    this.save();
  }

  addUser(id: string) {
    this.userList = [...this.userList, { id, isReady: false }];
    this.save();
    const user = UserMap.get(id);
    const message = new Message({ text: `${user?.nickname}님이 입장하셨습니다.` });
    message.send(this.roomName);
  }

  editUser(id: string, isReady: boolean) {
    this.userList = this.userList.map((user) => (user.id !== id ? user : { ...user, isReady }));
    this.save();
  }

  removeUser(id: string) {
    this.userList = this.userList.filter((user) => user.id !== id);
    this.save();
    const user = UserMap.get(id);
    const message = new Message({ text: `${user?.nickname}님이 방을 나가셨습니다.` });
    message.send(this.roomName);
  }

  save() {
    RoomMap.set(this.roomName, this);
    io.to(this.roomName).emit("userListSync", this.getRoomUserList());
  }

  delete() {
    RoomMap.delete(this.roomName);
  }

  getRoomUserList() {
    return this.userList.map((roomUser) => {
      const userInfo = UserMap.get(roomUser.id);
      return { ...roomUser, nickname: userInfo?.nickname || "", imgIdx: userInfo?.imgIdx || 0 };
    });
  }
}
