export const jobList = [
  ["mafia", "citizen", "citizen", "citizen", "citizen", "mafia", "citizen", "citizen"],
  ["citizen", "mafia", "citizen", "citizen", "citizen", "mafia", "citizen", "citizen"],
  ["citizen", "citizen", "mafia", "citizen", "citizen", "mafia", "citizen", "citizen"],
  ["citizen", "citizen", "citizen", "mafia", "citizen", "mafia", "citizen", "citizen"],
];

export const timerList = [
  {
    /** 밤 시간 */
    type: "night",
    ms: 60 * 1000,
    noticeMessage: "밤이 되었습니다",
  },
  {
    /** 낮 토론 시간 */
    type: "dayDiscussion",
    ms: 90 * 1000,
    noticeMessage: "낮이 되었습니다. 시민은 마피아를 색출하세요",
  },
  {
    /** 낮 투표 시간 */
    type: "dayVote",
    ms: 60 * 1000,
    noticeMessage: "투표시간이 되었습니다. 마피아를 골라주세요.",
  },
  {
    /** 낮 최종 변론 시간 */
    type: "dayFinal",
    ms: 60 * 1000,
    noticeMessage: "지목되신분은 최후의 변론을 하세요.",
  },
  {
    /** 최종 찬반 투표시간 */
    type: "dayFinalVote",
    ms: 60 * 1000,
    noticeMessage: "(을)를 살리느냐 죽이느냐 그것이 문제로다.",
  },
];

export default {};
