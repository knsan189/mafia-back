import { Socket } from "socket.io";

interface UserInterface {
  socketId: string;
  nickname?: string;
  imgIdx: number;
  currentRoomName: Room["roomName"];
}

export default class User implements UserInterface {
  private socket: Socket;

  public socketId: string;

  public nickname?: string | undefined;

  public imgIdx = 0;

  public currentRoomName: string;

  constructor({ socketId, currentRoomName, socket }) {
    this.socketId = socketId;
    this.currentRoomName = currentRoomName;
    this.socket = socket;
  }

  setNickname(nickname: string) {
    this.nickname = nickname;
  }

  setImgIdx(imgIdx: number) {
    this.imgIdx = imgIdx;
  }

  setCurrentRoomName(roomName: string) {
    this.currentRoomName = roomName;
  }

  joinRoom(roomName: string) {
    this.leaveRoom();
    this.socket.join(roomName);
    this.currentRoomName = roomName;
  }

  leaveRoom() {
    this.socket.leave(this.currentRoomName);
    this.currentRoomName = "";
  }
}
