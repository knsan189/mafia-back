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
  status: "idle" | "play";
  userList: { id: User["socketId"]; isReady: boolean }[];
}

interface Game {
  roomName: string;
  status: "night";
  userList: User[];
  timer: NodeJS.Timer;
}

interface Message {
  type: "userNotice" | "gameNotice";
  text: string;
  sender: string;
  receiver?: string;
}
