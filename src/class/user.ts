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
    this.log(roomName, "방 입장");
    const room = RoomMap.get(roomName);
    room?.addUser(this.id, this.nickname);
    this.setCurrentRoomName(roomName);
  }

  leaveRoom(socket: Socket) {
    if (this.currentRoomName) {
      socket.leave(this.currentRoomName);
      this.log(this.currentRoomName, "방 퇴장");
      const room = RoomMap.get(this.currentRoomName);
      room?.removeUser(this.id, this.nickname);
      const game = GameMap.get(this.currentRoomName);
      game?.removePlayer(this.id);
    }
    this.setCurrentRoomName("");
  }

  setCurrentRoomName(roomName: string) {
    this.currentRoomName = roomName;
    this.save();
  }

  save() {
    UserMap.set(this.id, this);
  }

  delete() {
    UserMap.delete(this.id);
  }

  disconnect(socket: Socket) {
    this.leaveRoom(socket);
    this.delete();
    this.log("접속 종료");
  }

  log(...text: string[]) {
    MaifaLog(`[유저/${this.id}]`, ...text);
  }
}
