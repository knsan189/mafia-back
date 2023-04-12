export default class User implements UserInterface {
  socketId: string;

  nickname?: string | undefined;

  imgIdx = 0;

  currentRoomName: string;

  constructor({ socketId, currentRoomName }) {
    this.socketId = socketId;
    this.currentRoomName = currentRoomName;
  }
}