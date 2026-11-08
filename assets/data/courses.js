/* =========================================================
   비하이브 수업 데이터 — 이 파일 하나만 고치면
   메뉴 · 분야 페이지 · 수업 상세 · 커리큘럼 표가 함께 바뀝니다.

   수업 추가 방법: COURSES 배열에 { ... } 한 덩어리를 복사해 붙이고 내용만 바꾸세요.
   - cat  : 분야 (ai / sw / career / conv / teacher / biz)  ※ biz는 비즈니스 사이트(biz/)에만 나옵니다
   - sub  : 분야 안의 하위 묶음 (아래 CATEGORIES의 subs id)
   - levels: 대상별 구성 (elem 초등 / mid 중등 / high 고등 / univ 대학 / adult 성인)
             없는 대상은 빼면 탭에서 자동으로 숨겨집니다.
   - also : 다른 분야 페이지에도 함께 보여줄 때 [{ cat, sub }]
   - sample: true 면 페이지에 '예시 구성' 안내가 붙습니다. 실제 수업으로 확정되면 false로.
   ========================================================= */
window.BH_LEVELS = {
  elem:  { label: '초등',      short: '초' },
  mid:   { label: '중등',      short: '중' },
  high:  { label: '고등',      short: '고' },
  univ:  { label: '대학',      short: '대' },
  adult: { label: '교원', short: '교원' }   /* 메인 사이트에서는 교원 연수에만 쓰입니다 */
};

window.BH_CATEGORIES = [
  { id: 'ai', name: 'AI', full: 'AI 교육', color: 'blue',
    lead: 'AI가 어떻게 배우고 판단하는지 이해하고, 바르게 쓰는 법까지 배웁니다.',
    why: 'AI는 이미 모두가 씁니다. 하지만 원리를 모르고 쓰면 잘못된 답을 그대로 믿거나, 남의 것을 내 것처럼 쓰게 됩니다.',
    subs: [ { id: 'basics', name: 'AI 기초' }, { id: 'literacy', name: 'AI 리터러시 · 윤리' }, { id: 'genai', name: '생성형 AI 활용' } ] },
  { id: 'sw', name: 'SW', full: 'SW 교육', color: 'orange',
    lead: '코딩과 피지컬 컴퓨팅으로 생각을 직접 작동하는 결과물로 만듭니다.',
    why: '머릿속 아이디어를 실제로 움직이게 만들어 본 경험은, 어떤 진로를 가든 문제를 푸는 힘이 됩니다.',
    subs: [ { id: 'physical', name: '아두이노 · 피지컬 컴퓨팅' }, { id: 'coding', name: '코딩 기초' } ] },
  { id: 'career', name: '진로', full: '진로 교육', color: 'green',
    lead: '고교학점제와 진로 탐색을 연결해, 나에게 맞는 다음 단계를 설계합니다.',
    why: '고교학점제가 시작되면서 중학생 때부터 "어떤 과목을 왜 고를지"가 진로와 바로 이어집니다.',
    subs: [ { id: 'credit', name: '고교학점제 · 자유학기' }, { id: 'explore', name: '진로 탐색 · 체험' }, { id: 'major', name: '학과 · 전공 탐색' }, { id: 'startup', name: 'AI 창업 · 해커톤' }, { id: 'camp', name: '진로 캠프' } ] },
  { id: 'conv', name: '융합', full: '융합 교육', color: 'dark',
    lead: 'AI와 SW를 도구로 독서, 금융, 과학 같은 교과를 새롭게 배웁니다.',
    why: '도구를 배우는 데서 끝나지 않고, 교과 안에서 직접 써 볼 때 배움이 생기부와 진로로 이어집니다.',
    subs: [ { id: 'reading', name: 'AI 독서' }, { id: 'finance', name: 'AI 금융 · 경제' }, { id: 'science', name: 'AI 과학 · MBL' } ] },
  { id: 'teacher', name: '교원 연수', full: '교원 연수', color: 'dark',
    lead: '선생님이 수업과 업무에 AI를 바로 쓸 수 있도록, 학교 현장에 맞춘 연수를 운영합니다.',
    why: 'AI를 늦게 접한 선생님도 교실에서 바로 쓸 방법만 알면, 수업은 풍성해지고 업무는 가벼워집니다.',
    subs: [ { id: 'ai-class', name: 'AI 수업 활용' }, { id: 'guidance', name: '진로 · 학업 지도' } ] },
  /* 기업 · 공공기관 교육은 별도 사이트(biz/)에서만 보여줍니다 (separate: true) */
  { id: 'biz', name: '기업·공공기관', full: '기업 · 공공기관 교육', color: 'dark', separate: true,
    lead: '기업 임직원과 공공기관을 위한 실무 중심 AI 교육입니다.',
    why: '도구 소개로 끝나는 강의가 아니라, 다음 주부터 일하는 방식이 달라지는 교육을 목표로 합니다.',
    subs: [ { id: 'corp', name: '기업 임직원' }, { id: 'public', name: '공공기관 · 지역' } ] }
];

window.BH_COURSES = [
  /* ---------------- AI ---------------- */
  { id: 'ai-how', cat: 'ai', sub: 'basics', sample: true,
    title: 'AI는 어떻게 배울까',
    summary: '놀이로 원리를 익히고, 직접 이미지·소리 분류 모델을 만들어 보는 AI 기초 수업',
    format: ['정규 수업'], prep: '학생 1인 1기기(노트북·태블릿), 인터넷',
    levels: {
      elem: { goal: 'AI가 "예시를 보고 배운다"는 것을 놀이로 이해한다', time: '2차시 × 40분',
        steps: ['카드 놀이로 분류 규칙 찾기', '티처블 머신으로 손동작 분류 모델 만들기'], tools: '언플러그드 카드, 티처블 머신', output: '우리 반 손동작 인식 AI', link: '실과 · 창체' },
      mid: { goal: '학습 데이터가 결과를 어떻게 바꾸는지 실험으로 확인한다', time: '3차시 × 45분',
        steps: ['AI · 머신러닝 개념', '이미지 분류 모델 만들기', '데이터를 바꿔 정확도 비교하기'], tools: '티처블 머신, 활동지', output: '분류 모델 + 실험 기록지', link: '정보 · 과학' },
      high: { goal: '편향과 한계를 데이터로 설명하고 개선안을 제안한다', time: '4차시 × 50분',
        steps: ['학습 원리와 평가 지표', '모델 만들기', '편향 실험', '개선 방안 발표'], tools: '티처블 머신, 스프레드시트', output: '모델 개선 보고서', link: '정보 · 세특 탐구' }
    } },
  { id: 'ai-literacy', cat: 'ai', sub: 'literacy', sample: true,
    title: '디지털 리터러시 · AI 윤리',
    summary: '가짜뉴스와 딥페이크를 가려내고, AI를 책임 있게 쓰는 나만의 기준을 세웁니다',
    format: ['정규 수업', '특강'], prep: '1인 1기기 권장 (모둠 활동 가능)',
    levels: {
      elem: { goal: '진짜와 가짜 정보를 구별하는 습관을 기른다', time: '2차시 × 40분',
        steps: ['진짜일까 가짜일까 퀴즈', '안전한 인터넷 약속 만들기'], tools: '퀴즈 카드, 활동지', output: '우리 반 디지털 약속', link: '도덕 · 창체' },
      mid: { goal: '딥페이크와 AI 생성물을 판별하고 확인 방법을 익힌다', time: '2차시 × 45분',
        steps: ['딥페이크 판별 미션', '출처 확인 · 사실 검증 실습'], tools: '판별 미션지, 검색 도구', output: '사실 확인 체크리스트', link: '도덕 · 정보' },
      high: { goal: 'AI 사용 원칙(출처, 저작권, 개인정보)을 스스로 정한다', time: '3차시 × 50분',
        steps: ['AI 윤리 쟁점 토론', '과제에서 AI 쓰는 법과 표기법', 'AI 사용 원칙 선언문 쓰기'], tools: '생성형 AI, 토론 카드', output: 'AI 사용 원칙 선언문', link: '정보 · 윤리 · 세특' }
    } },
  { id: 'ai-chatbot', cat: 'ai', sub: 'genai', sample: true,
    title: '나만의 AI 챗봇 만들기',
    summary: '코딩 없이 우리 학교 · 관심 분야를 안내하는 챗봇을 기획하고 만듭니다',
    format: ['정규 수업', '캠프'], prep: '1인 1노트북, 인터넷',
    levels: {
      mid: { goal: '질문과 답의 흐름을 설계해 간단한 챗봇을 만든다', time: '3차시 × 45분',
        steps: ['챗봇은 어떻게 대답할까', '대화 흐름 설계', '챗봇 만들고 친구와 테스트'], tools: '노코드 챗봇 도구', output: '학교 안내 챗봇', link: '정보 · 진로' },
      high: { goal: '생성형 AI에 역할과 자료를 주어 목적에 맞는 챗봇을 만든다', time: '4차시 × 50분',
        steps: ['프롬프트 설계', '자료 넣기와 답변 검증', '챗봇 개선', '시연과 발표'], tools: '생성형 AI 챗봇 도구', output: '진로 · 교과 도우미 챗봇', link: '정보 · 세특' },
      univ: { goal: '전공 · 동아리 업무를 돕는 챗봇을 기획해 배포한다', time: '6시간 (1일)',
        steps: ['문제 정의', '챗봇 설계 · 제작', '사용자 테스트', '발표'], tools: '생성형 AI 챗봇 도구', output: '배포한 챗봇 + 기획서', link: '교양 · 캡스톤' }
    } },

  /* ---------------- SW ---------------- */
  { id: 'sw-arduino', cat: 'sw', sub: 'physical', sample: false,
    title: '아두이노 기초',
    summary: '보드 구조와 전자회로, 프로그래밍 규칙을 익혀 LED · 센서를 직접 제어합니다',
    format: ['정규 수업', '캠프'], prep: '아두이노 우노 키트, 1인 1노트북',
    levels: {
      mid: { goal: '디지털 출력으로 LED를 켜고 끄는 회로를 만든다', time: '3차시 × 45분',
        steps: ['아두이노 보드 살펴보기', '브레드보드와 LED 회로', '깜빡이 · 신호등 만들기'], tools: '아두이노 우노, LED, 저항', output: '신호등 회로', link: '정보 · 기술' },
      high: { goal: '보드 구조, 전압 · 전류 한계, 프로그래밍 규칙을 이해하고 안전하게 회로를 구성한다', time: '2차시 × 100분',
        steps: ['보드 구조 (USB · 전압 레귤레이터 · 디지털/PWM 핀)', '프로그래밍 기본 규칙 (setup · loop)', '전자회로 기초와 핀 전류 한계'], tools: '아두이노 우노, 브레드보드, 점퍼선', output: 'LED · 스위치 제어 회로', link: '정보 · 물리' }
    } },
  { id: 'sw-block', cat: 'sw', sub: 'coding', sample: true,
    title: '블록코딩으로 시작하는 SW',
    summary: '블록을 조립하며 순서 · 반복 · 조건을 익히고 나만의 게임을 만듭니다',
    format: ['정규 수업'], prep: '1인 1기기, 인터넷',
    levels: {
      elem: { goal: '순서와 반복으로 캐릭터를 움직인다', time: '2차시 × 40분',
        steps: ['명령 순서 놀이', '엔트리로 캐릭터 움직이기'], tools: '엔트리', output: '움직이는 애니메이션', link: '실과' },
      mid: { goal: '조건과 변수를 써서 간단한 게임을 완성한다', time: '4차시 × 45분',
        steps: ['조건문', '변수와 점수', '게임 설계', '게임 완성 · 공유'], tools: '엔트리 · 스크래치', output: '나만의 게임', link: '정보' }
    } },

  /* ---------------- 진로 ---------------- */
  { id: 'career-credit', cat: 'career', sub: 'credit', sample: true,
    title: '고교학점제 과목 선택 로드맵',
    summary: '관심 진로에서 거꾸로 거슬러 올라가 고등학교 3년 과목 선택 계획을 세웁니다',
    format: ['정규 수업', '특강'], prep: '학교 교육과정 편성표 (사전 공유)',
    levels: {
      mid: { goal: '고교학점제를 이해하고 관심 계열에 맞는 과목을 알아본다', time: '2차시 × 45분',
        steps: ['고교학점제 한눈에 보기', '관심 계열과 과목 연결해 보기'], tools: '계열별 과목 카드', output: '관심 계열 과목 지도', link: '진로 (중3)' },
      high: { goal: '희망 학과에 필요한 과목을 찾아 3년 이수 계획을 세운다', time: '3차시 × 50분',
        steps: ['희망 학과 조사', '학교 편성표에서 과목 고르기', '3년 이수 로드맵과 근거 쓰기'], tools: '학교 편성표, 학과 정보 사이트', output: '과목 선택 로드맵', link: '진로 (고1) · 학업 설계' }
    } },
  { id: 'career-free', cat: 'career', sub: 'credit', sample: true,
    title: '자유학기 주제선택 프로그램',
    summary: '한 학기 동안 AI · 메이커 · 직업 탐구를 엮어 진행하는 중학교 1학년 주제선택 과정',
    format: ['학기 과정'], prep: '교실 · 기기 환경 사전 협의',
    levels: {
      mid: { goal: '관심 분야를 직접 해 보며 진로 흥미를 찾는다', time: '17차시 × 45분 (한 학기)',
        steps: ['AI 기초 체험', '메이커 프로젝트', '직업인 탐구', '학기말 발표회'], tools: 'AI 도구, 메이커 키트', output: '학기 포트폴리오 · 발표', link: '자유학기 (중1)' }
    } },
  { id: 'career-job', cat: 'career', sub: 'explore', sample: true,
    title: '찾아가는 직업 체험',
    summary: '데이터 과학자, 드론 조종사, AI 개발자 같은 직업을 교실에서 직접 해 봅니다',
    format: ['체험', '진로의 날'], prep: '교실 1곳 (직업별 키트는 비하이브가 준비)',
    levels: {
      elem: { goal: '여러 직업이 하는 일을 체험으로 알아본다', time: '2차시 × 40분',
        steps: ['직업 소개와 미션 받기', '직업인이 되어 미션 해결'], tools: '직업별 체험 키트', output: '직업 체험 수첩', link: '창체 · 진로' },
      mid: { goal: '체험한 직업에 필요한 역량과 진로 경로를 정리한다', time: '3차시 × 45분',
        steps: ['직업 미션 체험', '필요 역량 찾기', '나와 맞는 점 · 다른 점 정리'], tools: '직업별 체험 키트, 활동지', output: '직업 탐색 보고서', link: '진로' }
    } },
  { id: 'career-portfolio', cat: 'career', sub: 'explore', sample: true,
    title: '진로 적성 탐색과 포트폴리오',
    summary: '흥미 · 강점 검사 결과를 해석하고, 활동을 진로 포트폴리오로 정리합니다',
    format: ['정규 수업'], prep: '1인 1기기 (온라인 검사)',
    levels: {
      mid: { goal: '나의 흥미와 강점을 말로 설명할 수 있다', time: '2차시 × 45분',
        steps: ['흥미 · 강점 검사와 해석', '나를 소개하는 한 장'], tools: '온라인 진로 검사, 활동지', output: '나 소개서', link: '진로' },
      high: { goal: '검사 결과와 활동 경험을 묶어 진로 포트폴리오를 만든다', time: '3차시 × 50분',
        steps: ['검사 결과 해석', '활동 경험 정리', '포트폴리오 완성'], tools: '온라인 진로 검사, 포트폴리오 템플릿', output: '진로 포트폴리오', link: '진로 · 학생부 관리' }
    } },
  { id: 'career-future', cat: 'career', sub: 'explore', sample: true,
    title: 'AI 시대 미래 직업 탐구',
    summary: 'AI가 바꾸는 직업 세계를 조사하고, 내가 갈 길에서 AI와 함께 일하는 모습을 그려 봅니다',
    format: ['정규 수업', '특강'], prep: '1인 1기기 권장',
    levels: {
      elem: { goal: 'AI와 함께 일하는 미래 직업을 상상해 표현한다', time: '2차시 × 40분',
        steps: ['AI가 돕는 직업 찾기', '미래 직업 카드 만들기'], tools: '그림 생성 AI, 활동지', output: '미래 직업 카드', link: '창체 · 진로' },
      mid: { goal: '사라지는 일과 새로 생기는 일을 조사하고 비교한다', time: '2차시 × 45분',
        steps: ['직업 변화 조사', '모둠 발표'], tools: '생성형 AI, 조사 활동지', output: '직업 변화 발표 자료', link: '진로 · 사회' },
      high: { goal: '희망 분야에서 AI가 바꿀 일을 분석해 대비 전략을 세운다', time: '3차시 × 50분',
        steps: ['분야별 AI 활용 사례 조사', 'AI가 바꿀 일 분석', '나의 역량 계획 세우기'], tools: '생성형 AI, 보고서 양식', output: '진로 분석 보고서', link: '진로 · 세특' }
    } },
  { id: 'career-major', cat: 'career', sub: 'major', sample: true,
    title: '학과 · 전공 탐색과 세특 탐구 주제 찾기',
    summary: '희망 학과에서 무엇을 배우는지 알아보고, 교과 세특에 쓸 탐구 주제를 정합니다',
    format: ['정규 수업', '특강'], prep: '1인 1기기',
    levels: {
      mid: { goal: '계열별 대표 학과와 배우는 내용을 알아본다', time: '2차시 × 45분',
        steps: ['계열 · 학과 지도 그리기', '관심 학과 카드 만들기'], tools: '학과 카드, 조사 활동지', output: '관심 학과 카드', link: '진로' },
      high: { goal: '희망 전공과 교과를 잇는 탐구 주제를 찾고 계획서를 쓴다', time: '3차시 × 50분',
        steps: ['전공 교육과정 조사', '교과와 연결된 탐구 주제 찾기', '탐구 계획서 작성'], tools: '생성형 AI, 탐구 계획서 양식', output: '세특 탐구 계획서', link: '교과 세특 · 진로' }
    } },
  { id: 'career-startup', cat: 'career', sub: 'startup', sample: true, also: [{ cat: 'ai', sub: 'genai' }],
    title: 'AI 창업 캠프',
    summary: '생활 속 문제를 찾고 생성형 AI로 시장 조사 · 아이디어 · 시제품까지 만들어 투자 발표를 해 보는 창업 캠프',
    format: ['캠프'], prep: '모둠별 노트북 1대 이상, 발표 공간',
    levels: {
      mid: { goal: '생활 속 문제를 찾아 AI로 해결 아이디어를 만들고 발표한다', time: '1일 (5시간)',
        steps: ['우리 주변 문제 찾기', 'AI로 아이디어 넓히고 고르기', 'AI로 시제품 화면 · 포스터 만들기', '아이디어 발표'], tools: '생성형 AI, 이미지 생성 AI, 발표 키트', output: '창업 아이디어 포스터 · 발표', link: '진로 · 창체 · 기업가정신' },
      high: { goal: 'AI로 시장을 조사하고 비즈니스 모델을 설계해 모의 투자 발표를 한다', time: '1~2일 (6~12시간)',
        steps: ['문제 정의와 고객 인터뷰', 'AI로 시장 · 경쟁 조사', '비즈니스 모델 캔버스', '노코드 시제품 만들기', '모의 투자 발표'], tools: '생성형 AI, 노코드 도구, 디자인 도구', output: '사업 계획서 + 시제품 + 발표 자료', link: '진로 · 경제 · 세특' },
      univ: { goal: 'AI 기반 서비스를 기획 · 검증해 창업 지원사업 수준의 계획서를 완성한다', time: '2일 (12시간)',
        steps: ['문제 검증과 고객 인터뷰', 'AI 서비스 기획', 'MVP 제작', '사업계획서 작성', 'IR 피칭'], tools: '생성형 AI, 노코드 · 바이브코딩 도구', output: '사업계획서 + MVP + IR 자료', link: '창업 교과 · 캡스톤' }
    } },
  { id: 'career-hackathon', cat: 'career', sub: 'startup', sample: true, also: [{ cat: 'ai', sub: 'genai' }],
    title: 'AI 해커톤',
    summary: '팀을 이뤄 정해진 시간 안에 AI로 실제 문제를 해결하는 서비스를 만들고 겨루는 해커톤',
    format: ['해커톤', '캠프'], prep: '1인 1노트북, 인터넷, 발표 공간 (심사위원 섭외 가능)',
    levels: {
      mid: { goal: '팀으로 협력해 AI를 활용한 문제 해결 결과물을 완성한다', time: '1일 (6시간)',
        steps: ['주제 발표와 팀 구성', 'AI 도구 익히기', '팀별 제작', '시연과 시상'], tools: '생성형 AI, 노코드 앱 · 챗봇 도구', output: '팀별 AI 결과물 + 시연', link: '정보 · 진로 · 창체' },
      high: { goal: '사회 문제를 정의하고 AI 서비스 시제품을 만들어 심사를 받는다', time: '1박 2일 또는 2일 (12~16시간)',
        steps: ['문제 정의와 아이디어톤', '역할 나누기와 기획', 'AI 서비스 제작 (멘토링)', '발표 · 심사 · 시상'], tools: '생성형 AI, 노코드 · 바이브코딩 도구', output: 'AI 서비스 시제품 + 발표 자료', link: '정보 · 진로 · 세특' },
      univ: { goal: '실제 데이터와 AI로 작동하는 서비스를 만들어 기업 · 기관 심사를 받는다', time: '2일 (16시간 이상)',
        steps: ['주제 · 데이터 소개', '팀 빌딩과 기획', '개발과 멘토링', '데모데이 · 심사'], tools: '생성형 AI API, 개발 · 바이브코딩 도구', output: '작동하는 서비스 + 데모 영상', link: '교양 · 캡스톤 · 포트폴리오' }
    } },

  /* ---------------- 융합 ---------------- */
  { id: 'conv-reading', cat: 'conv', sub: 'reading', sample: true,
    title: 'AI 독서',
    summary: '책을 깊게 읽고, AI와 함께 질문 · 토론 · 창작하며 생각을 넓히는 독서 수업',
    format: ['정규 수업', '독서 교실'], prep: '수업 도서 (사전 협의), 1인 1기기',
    levels: {
      elem: { goal: '책 속 장면을 AI 그림으로 표현하며 이야기를 다시 쓴다', time: '2차시 × 40분',
        steps: ['함께 읽고 인상 깊은 장면 고르기', 'AI 그림으로 나만의 그림책 만들기'], tools: '그림 생성 AI', output: '나만의 AI 그림책', link: '국어 · 독서' },
      mid: { goal: 'AI에게 질문하며 책의 쟁점을 찾고 토론한다', time: '3차시 × 45분',
        steps: ['읽기와 질문 만들기', 'AI와 대화하며 관점 넓히기', '찬반 토론'], tools: '생성형 AI, 토론 활동지', output: '토론 기록지', link: '국어 · 독서' },
      high: { goal: 'AI 요약을 검증하고 나만의 관점으로 비평문을 쓴다', time: '4차시 × 50분',
        steps: ['읽기와 AI 요약 비교', 'AI 답의 오류 찾기', '쟁점 정리', '비평문 쓰기'], tools: '생성형 AI', output: '비평 에세이', link: '국어 · 독서 세특' }
    } },
  { id: 'conv-finance', cat: 'conv', sub: 'finance', sample: true,
    title: 'AI 금융 · 경제',
    summary: '용돈 관리부터 경제 데이터 읽기, AI가 만든 광고 · 금융사기 구별까지 배우는 금융 이해 수업',
    format: ['정규 수업', '특강'], prep: '1인 1기기 권장',
    levels: {
      elem: { goal: '필요와 욕구를 구분하고 용돈 계획을 세운다', time: '2차시 × 40분',
        steps: ['필요할까 갖고 싶을까 게임', 'AI와 함께 용돈 계획 세우기'], tools: '생성형 AI, 용돈 기입장', output: '나의 용돈 계획표', link: '사회 · 실과' },
      mid: { goal: 'AI가 만든 광고와 금융사기 수법을 구별한다', time: '2차시 × 45분',
        steps: ['AI 광고 · 사기 문자 판별', '안전한 금융 생활 수칙 만들기'], tools: '판별 미션지', output: '금융 안전 수칙 카드', link: '사회 · 기술가정' },
      high: { goal: '경제 데이터를 AI로 분석하고 근거 있는 의견을 쓴다', time: '3차시 × 50분',
        steps: ['물가 · 금리 데이터 읽기', 'AI로 그래프 만들고 해석 검증', '경제 칼럼 쓰기'], tools: '생성형 AI, 스프레드시트', output: '경제 데이터 칼럼', link: '경제 · 통합사회 세특' }
    } },
  { id: 'conv-mbl', cat: 'conv', sub: 'science', sample: false, also: [{ cat: 'sw', sub: 'physical' }, { cat: 'career', sub: 'camp' }],
    title: '스트로보스코프 MBL 캠프',
    summary: '아두이노로 스트로보스코프 MBL 장치와 p5.js 실시간 대시보드를 만들고, 생성형 AI로 회전 운동을 탐구하는 과학 융합 캠프',
    format: ['캠프', '탐구 프로젝트'], prep: '1인 1노트북, 아두이노 · 팬 · LED 스트립 · 워터펌프 키트 (비하이브 준비)',
    safety: ['회전하는 팬: 손가락 · 머리카락 · 옷이 날개에 닿지 않게 하고, 팬이 도는 동안 회로를 만지지 않습니다.',
      '물과 전기: 회로는 물그릇과 떨어뜨리고, 젖은 손으로 만지지 않으며, 배선을 바꾸기 전 전원을 끕니다.',
      '깜빡이는 LED: 드물게 광과민성 반응이 있을 수 있어, 불편하면 바로 시선을 돌리고 중단합니다.',
      '전원: 5V 핀에는 5V만 연결하고, 전원을 넣기 전 극성과 합선을 다시 확인합니다.'],
    levels: {
      mid: { goal: '스트로보 효과(잔상 · 착시) 원리를 체험으로 이해한다', time: '3차시 × 45분', sampleLevel: true,
        steps: ['거꾸로 물방울 시뮬레이터 체험', '완성 키트로 회전하는 팬 관찰', 'LED 주파수를 바꾸며 관찰 기록'], tools: '웹 시뮬레이터, 완성 스트로보 키트', output: '관찰 활동지', link: '과학 (빛 · 운동)' },
      high: { goal: '스트로보 효과와 시간적 앨리어싱을 설명하고, 팬 회전수를 측정 · 시각화해 탐구 보고서를 쓴다', time: '5차시 × 100분 (예시)',
        steps: ['CH1 결과물 미리보기 — 대시보드 · 장치 · 완성 영상으로 동기 유발',
          'CH2 아두이노 기초 — 보드 구조, 프로그래밍 규칙, 전자회로',
          'CH3 팬 + LED 스트립으로 스트로보스코프 MBL 제작 — 택트 스위치로 섬광 주파수 조절',
          'Mission "나우 유 씨 미" 거꾸로 물방울 — 워터펌프 + p5.js 대시보드 + AI로 코드 수정',
          '탐구 보고서 작성 — AI의 답을 직접 검증하며 정리'],
        tools: '아두이노 우노, 5V 팬, 네오픽셀 LED 스트립, 택트 스위치, 워터펌프, p5.js, 생성형 AI',
        output: 'MBL 장치 + p5.js 실시간 대시보드 + 탐구 보고서', link: '물리 · 정보 · 생기부 탐구' }
    } },

  /* ---------------- 기업 · 기관 ---------------- */
  { id: 'biz-genai', cat: 'biz', sub: 'corp', sample: true, also: [{ cat: 'biz', sub: 'public' }],
    title: '업무에 쓰는 생성형 AI',
    summary: '보고서 · 메일 · 기획서와 자료 정리를 생성형 AI로 바꾸는 실무 과정',
    format: ['출강 교육', '워크숍'], prep: '1인 1노트북, 사내 사용 가능한 AI 도구 확인',
    levels: {
      adult: { goal: '반복 문서 업무 시간을 줄이는 나만의 AI 활용법을 만든다', time: '4시간 / 8시간',
        steps: ['생성형 AI 원리와 한계', '문서 · 메일 · 기획서 실습', '내 업무에 적용하기', '사내 보안 · 활용 가이드'], tools: 'ChatGPT · Gemini 등 사내 허용 도구', output: '내 업무용 프롬프트 모음', link: '사내 AI 전환(AX)' }
    } },
  { id: 'biz-automation', cat: 'biz', sub: 'corp', sample: true,
    title: 'AI 업무 자동화 (노코드)',
    summary: '반복 업무를 노코드 도구와 AI로 자동화해 현업 부서가 스스로 개선합니다',
    format: ['출강 교육', '워크숍'], prep: '1인 1노트북',
    levels: {
      adult: { goal: '팀의 반복 업무 하나를 직접 자동화한다', time: '8시간 (1일)',
        steps: ['자동화할 업무 찾기', '노코드 자동화 실습', 'AI 연결', '팀 업무 적용 발표'], tools: '노코드 자동화 도구, 생성형 AI', output: '자동화한 업무 흐름', link: '업무 효율화' }
    } },
  { id: 'biz-public', cat: 'biz', sub: 'public', sample: true,
    title: '공무원 AI 활용 연수',
    summary: '공문 · 보도자료 · 민원 응대에 AI를 안전하게 쓰는 방법을 익힙니다',
    format: ['연수'], prep: '기관 보안 정책 사전 확인',
    levels: {
      adult: { goal: '보안 기준을 지키며 행정 문서 업무에 AI를 쓴다', time: '3시간 / 6시간',
        steps: ['공공 분야 AI 활용 지침', '공문 · 보도자료 실습', '민원 응대 문안 만들기'], tools: '기관 허용 AI 도구', output: '부서별 AI 활용 예시집', link: '공공 AI 전환' }
    } },
  { id: 'biz-senior', cat: 'biz', sub: 'public', sample: true,
    title: '시니어 디지털 · AI 생활',
    summary: '스마트폰 AI 비서, 키오스크, AI 보이스피싱 예방까지 생활에 바로 쓰는 디지털 교육',
    format: ['복지관 · 도서관 프로그램'], prep: '개인 스마트폰',
    levels: {
      adult: { goal: '생활 속 디지털 기기를 두려움 없이 쓴다', time: '4회 × 90분',
        steps: ['스마트폰 AI 비서 쓰기', '키오스크 · 앱 예약', 'AI 보이스피싱 · 가짜 영상 구별', '사진 · 영상 남기기'], tools: '개인 스마트폰, 키오스크 연습 화면', output: '나만의 디지털 생활 수첩', link: '지역 평생교육' }
    } },
  { id: 'teacher-genai', cat: 'teacher', sub: 'ai-class', sample: true,
    title: '선생님을 위한 생성형 AI',
    summary: '수업 설계, 평가, 행정 업무에 생성형 AI를 쓰는 교원 연수',
    format: ['연수'], prep: '1인 1노트북',
    levels: {
      adult: { goal: '내 수업 하나를 AI 활용 수업으로 다시 설계한다', time: '3시간 / 15시간 (직무연수)',
        steps: ['교실 속 생성형 AI 활용 원칙', '수업 자료 · 평가 문항 만들기', '행정 업무 줄이기', 'AI 활용 수업 설계'], tools: '생성형 AI, 수업 설계 템플릿', output: 'AI 활용 수업 지도안', link: '교원 연수 · 연구회' }
    } },
  { id: 'teacher-credit', cat: 'teacher', sub: 'guidance', sample: true,
    title: '고교학점제 진로 · 학업 설계 지도',
    summary: '학생의 진로와 과목 선택을 연결해 지도하는 방법을, AI 도구와 실제 사례로 익히는 교원 연수',
    format: ['연수'], prep: '1인 1노트북, 학교 교육과정 편성표',
    levels: {
      adult: { goal: '학생 상담에서 진로와 과목 선택을 근거 있게 연결해 안내한다', time: '3시간 / 15시간 (직무연수)',
        steps: ['고교학점제와 과목 선택의 흐름', '진로 · 학업 설계 상담 사례', 'AI로 학과 · 과목 정보 정리하기', '우리 학교용 상담 자료 만들기'], tools: '생성형 AI, 학교 편성표, 상담 양식', output: '우리 학교 과목 선택 상담 자료', link: '교원 연수 · 진로진학 지도' }
    } },
];
