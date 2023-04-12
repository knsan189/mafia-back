import { Socket } from "socket.io";

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

  constructor({ currentRoomName, id }) {
    this.id = id;
    this.currentRoomName = currentRoomName;
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

  joinRoom(socket: Socket, roomName: string) {
    this.leaveRoom(socket);
    socket.join(roomName);
    this.currentRoomName = roomName;
  }

  leaveRoom(socket: Socket) {
    socket.leave(this.currentRoomName);
    this.currentRoomName = "";
  }
}
