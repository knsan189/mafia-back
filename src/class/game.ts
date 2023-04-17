import Room from "./room.js";
import User from "./user.js";
import io, { GameMap, RoomMap, UserMap } from "../socket.js";
import { sendMessage } from "../utils/messsage.js";
import { stageConfig } from "../config/const.config.js";
import MaifaLog from "../utils/log.js";

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
    room.startGame();
    this.notify("게임이 잠시 후 시작 됩니다.");
    this.log("게임 생성");
  }

  init() {
    this.log("게임 시작");
    this.setStage(this.currentStage);
    const second = 1000;
    this.timer = setInterval(() => {
      if (this.remainingTime <= 0) {
        let targetStage = this.currentStage + 1;
        if (targetStage === stageConfig.length) targetStage = 0;
        this.gameEvent();
        this.setStage(targetStage);
      }
      io.to(this.roomName).emit("timerSync", this.remainingTime);
      this.remainingTime -= second;
    }, second);
  }

  gameEvent() {
    switch (this.currentStatus) {
      /** 밤이 끝났을때 */
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
    this.gameStatusSync();
    this.notify(stageInfo.message);
    this.log("스테이지", stageInfo.status, "로 변경");
  }

  setTargetPlayer(id: Player["id"]) {
    this.targetPlayer = id;
    this.targetPlayerSync();
    this.log("지목 대상 변경", id);
  }

  removePlayer(id: Player["id"]) {
    this.playerList = this.playerList.filter((player) => player.id !== id);
    this.playerListSync();
    this.checkGameover();
  }

  killPlayer(id: Player["id"]) {
    this.playerList = this.playerList.map((player) =>
      player.id === id ? { ...player, status: "dead" } : player,
    );
    this.playerListSync();
    const targetUser = UserMap.get(id);
    this.notify(`${targetUser?.nickname}님이 사망하셨습니다.`);
    this.log(id, "죽음");
    this.setTargetPlayer("");
  }

  checkGameover() {
    let mafiaCount = 0;
    this.playerList.forEach((player) => {
      if (player.job === "mafia") mafiaCount += 1;
    });

    if (mafiaCount === 0) {
      this.gameover();
      this.notify("마피아가 모두 죽어 시민이 승리했습니다.");
    }
  }

  gameover() {
    clearInterval(this.timer);
    const room = RoomMap.get(this.roomName);
    room?.endGame();
    this.notify("게임 종료");
    this.delete();
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

  log(...text: string[]) {
    MaifaLog(`[게임/${[this.roomName]}]`, ...text);
  }

  notify(text: string) {
    sendMessage(this.roomName, { text, type: "gameNotice" });
  }
}
