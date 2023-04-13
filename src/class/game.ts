import Room from "./room.js";
import User from "./user.js";
import io, { GameMap, UserMap } from "../socket.js";
import Message from "./messsage.js";
import { stageConfig } from "../config/const.config.js";

export interface Player {
  id: User["id"];
  job: "mafia" | "citizen";
  status: "alive" | "dead";
}

export type GameStatus =
  | "night"
  | "dayDiscussion"
  | "dayVote"
  | "dayFinal"
  | "dayFinalVote"
  | "end";

export type JobType = "mafia" | "citizen";

export default class Game {
  roomName: string;

  playerList: Player[] = [];

  voteIdList: Player["id"][] = [];

  targetPlayer: Player["id"] = "";

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
    const message = new Message({ text: "게임이 잠시 후 시작됩니다.", type: "gameNotice" });
    message.send(this.roomName);
  }

  init() {
    const second = 1000;
    this.setStage(this.currentStage);
    this.timer = setInterval(() => {
      if (this.remainingTime <= 0) {
        this.gameEvent();
        this.setStage((this.currentStage += 1));
      }
      io.to(this.roomName).emit("timerSync", this.remainingTime);
      this.remainingTime -= second;
    }, second);
  }

  gameEvent() {
    switch (this.currentStatus) {
      case "night": {
        if (this.targetPlayer) {
          this.killPlayer(this.targetPlayer);
        }
        break;
      }
      default:
        break;
    }
  }

  setStage(targetStage: number) {
    const stageInfo = stageConfig[targetStage];
    this.currentStage = targetStage;
    this.currentStatus = stageInfo.status;
    this.remainingTime = stageInfo.ms;
    const message = new Message({ text: stageInfo.message, type: "gameNotice" });
    message.send(this.roomName);
    this.gameStatusSync();
  }

  setTargetPlayer(id: Player["id"]) {
    this.targetPlayer = id;
  }

  removePlayer(id: Player["id"]) {
    this.playerList = this.playerList.filter((player) => player.id !== id);
    this.playerListSync();
  }

  killPlayer(id: Player["id"]) {
    this.playerList = this.playerList.map((player) =>
      player.id === id ? { ...player, status: "dead" } : player,
    );
    this.playerListSync();
    const targetUser = UserMap.get(id);
    const message = new Message({
      text: `${targetUser?.nickname}님이 사망하셨습니다.`,
      type: "gameNotice",
    });
    message.send(this.roomName);
  }

  save() {
    GameMap.set(this.roomName, this);
  }

  delete() {
    GameMap.delete(this.roomName);
  }

  playerListSync() {
    io.to(this.roomName).emit("playerListSync", this.playerList);
    this.save();
  }

  gameStatusSync() {
    io.to(this.roomName).emit("gameStatusSync", this.currentStatus);
    this.save();
  }

  targetPlayerSync() {
    io.to(this.roomName).emit("targetPlayerSync", this.targetPlayer);
    this.save();
  }
}
