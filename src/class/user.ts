import { Socket } from "socket.io";
import { UserMap } from "../socket.js";
import MaifaLog from "../utils/log.js";

interface UserConstructor {
  id: string;
  nickname: string;
  imgIdx: number;
}

export default class User {
  public id: string;

  public nickname: string;

  public imgIdx: number = 0;

  public currentRoomName: string = "";

  constructor({ id, nickname, imgIdx }: UserConstructor) {
    this.id = id;
    this.nickname = nickname;
    this.imgIdx = imgIdx;
    this.save();
    this.log("신규 생성");
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
