interface GameInterface {
  roomName: string;
  status: "night" | "dayDiscussion" | "dayVote" | "dayFinal" | "dayFinalVote";
  userList: Player[];
  voteList: Player["socketId"][];
  timer: NodeJS.Timer;
  targetPlayer?: Player["socketId"];
}

export default class Game implements GameInterface {
  roomName: string;

  status: "night" | "dayDiscussion" | "dayVote" | "dayFinal" | "dayFinalVote";

  userList: Player[];

  voteList: string[];

  timer: NodeJS.Timer;

  targetPlayer?: string | undefined;

  constructor({ roomName, timer }) {
    this.roomName = roomName;
    this.status = "night";
    this.userList = [];
    this.voteList = [];
    this.timer = timer;
  }
}
