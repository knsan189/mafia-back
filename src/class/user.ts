import { Socket } from "socket.io";
import { UserMap } from "../socket.js";
import MaifaLog from "../utils/log.js";

interface UserInterface {
  id: string;
  nickname?: string;
  imgIdx: number;
  currentRoomName: Room["roomName"];
}

export default class User implements UserInterface {
  public id: string;

  public nickname?: string | undefined;

  public imgIdx = 0;

  public currentRoomName: string;

  constructor(id: string) {
    this.id = id;
    this.currentRoomName = `${Math.floor(
      Math.random() * 1000 + new Date().getTime(),
    ).toString()}_temp`;
    this.log("신규 접속");
  }

  editUser(nickname: string, imgIdx: number) {
    this.nickname = nickname;
    this.imgIdx = imgIdx;
    this.save();
    this.log(`${nickname} 설정`);
  }

  joinRoom(socket: Socket, roomName: string) {
    this.leaveRoom(socket);
    socket.join(roomName);
    this.currentRoomName = roomName;
    this.save();
    this.log(`'${roomName}' 방 입장`);
  }

  leaveRoom(socket: Socket) {
    socket.leave(this.currentRoomName);
    this.currentRoomName = "";
    this.log(`'${this.currentRoomName}' 방 퇴장`);
  }

  save() {
    UserMap.set(this.id, this);
  }

  disconnect(socket: Socket) {
    this.leaveRoom(socket);
    UserMap.delete(this.id);
    this.log(`'${this.currentRoomName}' 접속 해제`);
  }

  log(text: string) {
    MaifaLog(`[유저 ${this.id}]`, text);
  }
}
