/* eslint-disable no-use-before-define */
interface User {
  socketId: string;
  nickname?: string;
  imgIdx: number;
  currentRoomName: Room["roomName"];
}

interface Gamer extends User {
  job: "mafia" | "citizen";
  status: "alive" | "dead";
  joinedTime: Date;
}

interface Room {
  roomName: string;
  userList: User[];
}

interface Game {
  status: "idle" | "play" | "end";
  userList: User[];
}
