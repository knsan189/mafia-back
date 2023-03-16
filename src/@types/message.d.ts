export interface MessageResponse {
  reply?: string;
  secondReply?: string;

  /** 밀리세컨드 딜레이 */
  delayTime?: number;
  status: string;
}

export interface MessageRequest {
  /** 방 이름 */
  room: string;

  /** 메세지 */
  msg: string;

  /** 발신자 */
  sender: string;

  /** 단톡방유무 */
  isGroupChat: boolean;

  imageDB: string;

  packageName: string;
}
