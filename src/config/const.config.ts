export const stageConfig: {
  status: "night" | "dayDiscussion" | "dayVote" | "dayFinal" | "dayFinalVote";
  ms: number;
  message: string;
}[] = [
  {
    /** 밤 시간 */
    status: "night",
    ms: 60 * 1000,
    message: "밤이 되었습니다",
  },
  {
    /** 낮 토론 시간 */
    status: "dayDiscussion",
    ms: 90 * 1000,
    message: "낮이 되었습니다. 시민은 마피아를 색출하세요",
  },
  {
    /** 낮 투표 시간 */
    status: "dayVote",
    ms: 60 * 1000,
    message: "투표시간이 되었습니다. 마피아를 골라주세요.",
  },
  {
    /** 낮 최종 변론 시간 */
    status: "dayFinal",
    ms: 60 * 1000,
    message: "지목되신분은 최후의 변론을 하세요.",
  },
  {
    /** 최종 찬반 투표시간 */
    status: "dayFinalVote",
    ms: 60 * 1000,
    message: "(을)를 살리느냐 죽이느냐 그것이 문제로다.",
  },
];

export default {};
