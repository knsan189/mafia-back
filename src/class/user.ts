import { Socket } from "socket.io";
import { UserMap } from "../socket.js";

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
    this.currentRoomName = Math.floor(Math.random() * 1000 + new Date().getTime()).toString();
  }

  editUser(nickname: string, imgIdx: number) {
    this.nickname = nickname;
    this.imgIdx = imgIdx;
    this.save();
  }

  joinRoom(socket: Socket, roomName: string) {
    this.leaveRoom(socket);
    socket.join(roomName);
    this.currentRoomName = roomName;
    this.save();
  }

  leaveRoom(socket: Socket) {
    socket.leave(this.currentRoomName);
    this.currentRoomName = "";
  }

  save() {
    UserMap.set(this.id, this);
  }

  disconnect(socket: Socket) {
    this.leaveRoom(socket);
    UserMap.delete(this.id);
  }
}
