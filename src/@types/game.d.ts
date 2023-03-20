/* eslint-disable no-use-before-define */
interface User {
  socketId: string;
  nickname?: string;
  imgIdx: number;
  currentRoomName: Room["roomName"];
}

interface Player {
  socketId: string;
  job: "mafia" | "citizen";
  status: "alive" | "dead";
}

interface Room {
  roomName: string;
  status: "idle" | "play";
  userList: { id: User["socketId"]; isReady: boolean }[];
}

interface Game {
  roomName: string;
  status: "night" | "dayDiscussion" | "dayVote" | "dayFinal" | "dayFinalVote";
  userList: Player[];
  voteList: User["socketId"][];
  timer: NodeJS.Timer;
  ms: number;
  message: string;
}

interface Message {
  type: "userNotice" | "gameNotice" | "voteNotice" | "mafiaChat" | "userChat";
  text: string;
  sender: string;
  receiver?: string;
}
