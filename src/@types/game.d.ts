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
  userList: { id: User["socketId"]; isReady: boolean }[];
}

interface Game {
  status: "idle" | "play" | "end";
  userList: User[];
}

interface Message {
  type: "userNotice";
  text: string;
  sender: string;
  receiver?: string;
}
