/*
 * 포트폴리오 내용은 이 파일에서 수정합니다.
 * fields의 value가 비어 있으면 '등록 예정'으로 표시됩니다.
 * entries가 비어 있으면 각 화면의 안내 문구가 표시됩니다.
 *
 * entries 작성 예시 (대괄호 안을 실제 내용으로 바꿔 주세요):
 * { title: '프로젝트명', meta: '기간 · 담당 역할',
 *   description: '진행한 일과 배운 점', url: 'https://example.com' }
 * url은 선택 사항입니다. 없는 경우 생략하세요.
 */
window.portfolioContent = {
  university: {
    title: '대학생', english: 'UNIVERSITY', accent: '#252a34', accentRgb: '37,42,52',
    tagline: '가능성을 발견하고,\n나만의 방향을 찾다.',
    description: '전공 공부부터 새로운 도전까지.\n배움의 출발점을 담는 공간입니다.',
    indexLabel: 'THE BEGINNING', overviewTitle: '대학 생활',
    fields: [
      { label: '학교 · 전공', value: '' },
      { label: '재학 기간', value: '' },
      { label: '관심 분야', value: '' }
    ],
    storyEyebrow: 'EXPERIENCES', storyTitle: '활동과 프로젝트',
    emptyTitle: '첫 번째 기록을 기다리고 있어요',
    emptyDescription: '교내 활동, 팀 프로젝트, 배운 점을 담아 주세요.',
    footnote: '배움과 도전이 쌓이는 곳', entries: []
  },
  bootcamp: {
    title: '부트캠프', english: 'BOOTCAMP', accent: '#252a34', accentRgb: '37,42,52',
    tagline: '배움을 실전으로,\n함께 만드는 경험.',
    description: '집중해서 배우고, 함께 고민한 시간.\n실전으로 이어지는 과정을 담습니다.',
    indexLabel: 'LEARN BY BUILDING', overviewTitle: '부트캠프 과정',
    fields: [
      { label: '교육 기관', value: '' },
      { label: '참여 기간', value: '' },
      { label: '학습 기술', value: '' }
    ],
    storyEyebrow: 'PROJECTS', storyTitle: '학습과 팀 프로젝트',
    emptyTitle: '함께 만든 경험을 기록해 보세요',
    emptyDescription: '프로젝트, 맡은 역할, 해결한 문제를 담아 주세요.',
    footnote: '배운 것을 직접 만들어 보는 시간', entries: []
  },
  career: {
    title: '경력사항', english: 'CAREER', accent: '#252a34', accentRgb: '37,42,52',
    tagline: '경험을 쌓고,\n더 나은 가치를 만들다.',
    description: '현장에서 마주한 문제와 만들어 낸 변화.\n일하며 쌓아 온 경험을 담습니다.',
    indexLabel: 'THE NEXT CHAPTER', overviewTitle: '업무 경험',
    fields: [
      { label: '회사 · 직무', value: '' },
      { label: '근무 기간', value: '' },
      { label: '주요 업무', value: '' }
    ],
    storyEyebrow: 'SELECTED WORK', storyTitle: '프로젝트와 성과',
    emptyTitle: '경험이 다음 이야기가 됩니다',
    emptyDescription: '담당한 업무, 기여한 부분, 주요 성과를 담아 주세요.',
    footnote: '경험으로 증명하는 나의 성장', entries: []
  }
};
