import { Socket } from "socket.io";
import { GameMap, RoomMap, UserMap } from "../socket.js";
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
    this.log("신규 접속");
  }

  editUser(nickname: string, imgIdx: number) {
    this.nickname = nickname;
    this.imgIdx = imgIdx;
    this.save();
    this.log(nickname, "닉네임 설정");
  }

  joinRoom(socket: Socket, roomName: string) {
    socket.join(roomName);
    this.currentRoomName = roomName;
    this.save();
    this.log(roomName, "방 입장");
  }

  leaveRoom(socket: Socket) {
    socket.leave(this.currentRoomName);
    this.log(this.currentRoomName, "방 퇴장");
    this.currentRoomName = "";
    this.save();
  }

  save() {
    UserMap.set(this.id, this);
  }

  delete() {
    UserMap.delete(this.id);
  }

  disconnect(socket: Socket) {
    const room = RoomMap.get(this.currentRoomName);
    const game = GameMap.get(this.currentRoomName);
    game?.removePlayer(this.id);
    room?.removeUser(this.id, this.nickname);
    this.leaveRoom(socket);
    this.delete();
    this.log("접속 종료");
  }

  log(...text: string[]) {
    MaifaLog(`[유저/${this.id}]`, ...text);
  }
}
