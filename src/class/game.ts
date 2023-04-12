import Room from "./room";
import User from "./user";
import io from "../socket.js";

export interface Player {
  id: User["id"];
  job: "mafia" | "citizen";
  status: "alive" | "dead";
}

export type GameStatus = "night" | "dayDiscussion" | "dayVote" | "dayFinal" | "dayFinalVote";

interface GameConstructor {
  roomName: Room["roomName"];
  roomUserList: Room["userList"];
}

type JobType = "mafia" | "citizen";

export default class Game {
  roomName: string;

  status: GameStatus = "night";

  playerList: Player[];

  voteIdList: Player["id"][] = [];

  targetPlayer?: string | undefined;

  jobList: JobType[] = [
    "mafia",
    "citizen",
    "citizen",
    "citizen",
    "citizen",
    "mafia",
    "citizen",
    "citizen",
  ];

  // timer: NodeJS.Timer;

  constructor({ roomName, roomUserList }: GameConstructor) {
    this.roomName = roomName;
    this.shuffle();
    this.playerList = roomUserList.map((user, index) => ({
      id: user.id,
      job: this.jobList[index],
      status: "alive",
    }));
  }

  shuffle() {
    io.to(this.roomName).emit("messageResponse", {
      text: "직업 섞는중...",
      sender: "Server",
      type: "gameNotice",
      id: Date.now().toString(),
    });
    this.jobList = this.jobList.sort(() => Math.random() - 0.5);
  }
}
