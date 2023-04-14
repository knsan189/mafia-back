import io, { RoomMap, UserMap } from "../socket.js";
import MaifaLog from "../utils/log.js";
import { sendMessage } from "../utils/messsage.js";

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
    this.log("생성");
  }

  addUser(id: string, nickname: string) {
    this.userList = [...this.userList, { id, isReady: false }];
    this.save();
    this.notify(`${nickname}님이 입장했습니다.`);
    this.log(`유저 ${id} 입장`);
  }

  editUser(id: string, isReady: boolean) {
    this.userList = this.userList.map((user) => (user.id !== id ? user : { ...user, isReady }));
    this.save();
    this.log(`유저 ${id}`, isReady ? "레디 완료" : "레디 해제");
  }

  removeUser(id: string, nickname: string) {
    this.userList = this.userList.filter((user) => user.id !== id);
    this.save();
    this.notify(`${nickname}님이 퇴장했습니다.`);
    this.log(`유저 ${id} 방 나감`);
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

  log(...text: string[]) {
    MaifaLog(`[방 ${[this.roomName]}]`, ...text);
  }

  notify(text: string) {
    sendMessage(this.roomName, { text });
  }
}
