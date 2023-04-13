import Room from "./room.js";
import User from "./user.js";
import io, { GameMap } from "../socket.js";
import Message from "./messsage.js";
import { stageConfig } from "../config/const.config.js";

export interface Player {
  id: User["id"];
  job: "mafia" | "citizen";
  status: "alive" | "dead";
}

export type GameStatus = "night" | "dayDiscussion" | "dayVote" | "dayFinal" | "dayFinalVote";

export type JobType = "mafia" | "citizen";

export default class Game {
  roomName: string;

  playerList: Player[] = [];

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

  currentStage = 0;

  currentStatus: GameStatus = "night";

  remainingTime = 0;

  timer?: NodeJS.Timer;

  constructor(room: Room) {
    this.roomName = room.roomName;
    this.jobList = this.jobList.sort(() => Math.random() - 0.5);
    this.playerList = room.userList.map((user, index) => ({
      id: user.id,
      job: this.jobList[index],
      status: "alive",
    }));
  }

  init() {
    const second = 1000;
    this.setStage(this.currentStage);
    this.timer = setInterval(() => {
      if (this.remainingTime <= 0) {
        this.setStage((this.currentStage += 1));
      }
      io.to(this.roomName).emit("timerSync", this.remainingTime);
      this.remainingTime -= second;
    }, second);
  }

  setStage(targetStage: number) {
    const stageInfo = stageConfig[targetStage];
    this.currentStage = targetStage;
    this.currentStatus = stageInfo.status;
    this.remainingTime = stageInfo.ms;
    const message = new Message({ text: stageInfo.message, type: "gameNotice" });
    message.send(this.roomName);
    this.save();
  }

  removePlayer(id: Player["id"]) {
    this.playerList = this.playerList.filter((player) => player.id !== id);
    this.syncPlayerList();
    this.save();
  }

  save() {
    GameMap.set(this.roomName, this);
  }

  syncPlayerList() {
    io.to(this.roomName).emit("playerListSync", this.playerList);
  }
}
