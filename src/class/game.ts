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

  targetList: { [key: Player["id"]]: Player["id"] } = {};

  voteList: { [key: Player["id"]]: boolean } = {};

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
    this.timer = setInterval(() => {
      if (this.remainingTime <= 0) {
        this.gameEvent();
        let targetStage = this.currentStage + 1;
        if (targetStage === stageConfig.length) targetStage = 0;
        this.setStage(targetStage);
      }
      io.to(this.roomName).emit("timerSync", this.remainingTime);
      this.remainingTime -= 1000;
    }, 1000);
  }

  timerCallback() {
    if (this.remainingTime <= 0) {
      this.gameEvent();
      let targetStage = this.currentStage + 1;
      if (targetStage === stageConfig.length) targetStage = 0;
      this.setStage(targetStage);
    }
    io.to(this.roomName).emit("timerSync", this.remainingTime);
    this.remainingTime -= 1000;
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
      /** 투표 종료 */
      case "dayVote": {
        const tempArr: { id: string; count: number }[] = [];

        Object.keys(this.targetList).forEach((key) => {
          const target = this.targetList[key];
          const targetIndex = tempArr.findIndex((item) => item.id === target);
          if (targetIndex === -1) {
            tempArr.push({ id: target, count: 1 });
          } else {
            tempArr[targetIndex].count += 1;
          }
        });

        let text = "투표 결과 : ";

        tempArr
          .sort((a, b) => b.count - a.count)
          .forEach((item) => {
            const targetUser = UserMap.get(item.id);
            text += `[${targetUser?.nickname}] ${item.count}표 `;
          });

        this.notify(text);
        this.targetList = {};

        if (!tempArr[0]) {
          this.currentStage += 2;
          this.notify("투표가 없으므로 아무도 죽지 않았습니다.");
          this.log("투표 아무도 안함");
          break;
        }

        if (tempArr[1] && tempArr[0].count === tempArr[1].count) {
          this.currentStage += 2;
          this.notify(
            `${tempArr[0].count}표 ${tempArr[1].count}표 동표이므로 아무도 죽지 않았습니다.`,
          );
          this.log("투표 동표");
          break;
        }

        const targetUser = UserMap.get(tempArr[0].id);
        this.setTargetPlayer(tempArr[0].id);
        this.notify(`${targetUser?.nickname}님이 ${tempArr[0].count}표로 지목 되셨습니다.`);
        break;
      }

      case "dayFinal": {
        const targetUser = UserMap.get(this.targetPlayer);
        this.notify(`${targetUser?.nickname}을 죽일까요 살릴까요?`);
        break;
      }

      case "dayFinalVote": {
        let trueCount = 0;
        let falseCount = 0;

        Object.keys(this.voteList).forEach((key) => {
          if (this.voteList[key]) trueCount += 1;
          else falseCount += 1;
        });

        this.notify(`투표 결과 : 찬성 ${trueCount}표, 반대 ${falseCount}표`);
        this.voteList = {};

        if (trueCount > falseCount) {
          this.killPlayer(this.targetPlayer);
          break;
        }

        const targetUser = UserMap.get(this.targetPlayer);
        this.notify(`반대표가 많으므로 ${targetUser?.nickname}님은 죽지 않았습니다.`);
        this.setTargetPlayer("");
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
    this.checkGameover();
  }

  setVoteList(id: string, bool: boolean) {
    this.voteList = { ...this.voteList, [id]: bool };
  }

  setTargetList(userId: string, targetId: string) {
    this.targetList = { ...this.targetList, [userId]: targetId };
    this.log(userId, "가", targetId, "을 지목");
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
    let citizenCount = 0;
    let mafiaCount = 0;
    this.playerList.forEach((player) => {
      if (player.status === "alive") {
        if (player.job === "mafia") mafiaCount += 1;
        else citizenCount += 1;
      }
    });

    if (mafiaCount === 0) {
      this.notify("마피아가 모두 죽어 시민이 승리했습니다.");
      this.log("시민 승");
      this.gameover();
      return;
    }

    if (mafiaCount === citizenCount) {
      this.notify("마피아 수가 시민 수와 같으므로, 마피아가 승리 했습니다.");
      this.log("마피아 승");
      this.gameover();
    }
  }

  gameover() {
    clearInterval(this.timer);
    this.currentStatus = "end";
    this.gameStatusSync();
    this.playerList = [];
    this.playerListSync();
    this.targetPlayer = "";
    this.targetPlayerSync();
    const room = RoomMap.get(this.roomName);
    room?.endGame();
    this.notify("게임 종료");
    this.delete();
  }

  save() {
    GameMap.set(this.roomName, this);
  }

  delete() {
    this.log("게임 삭제");
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
