/* =========================================================
   비하이브 제작 영상 목록 (media.html 에 그대로 나타납니다)
   - 영상을 하나 추가하려면 아래 목록에 { ... } 한 덩어리를 복사해 붙이고 내용을 바꾸면 됩니다.
   - youtube : 유튜브 주소 (예: 'https://youtu.be/abcd1234' 또는 'https://www.youtube.com/watch?v=abcd1234')
   - file    : 유튜브 대신 직접 올린 영상 파일 (예: 'assets/video/school-promo.mp4')
   - poster  : 영상 파일일 때 첫 화면 이미지 (선택)
   - type    : edu(교육 콘텐츠) · promo(홍보) · event(행사 스케치) · short(숏폼)
   - 아래 3개는 자리 확인용 예시입니다. 실제 영상으로 바꿔 주세요. (youtube 를 비워 두면 '영상 준비 중'으로 보입니다)
   ========================================================= */
window.BH_VIDEOS = [
  { title: '예시 · AI 교육 수업 스케치', type: 'event', client: '○○초등학교', year: '2026', desc: '학생들이 생성형 AI로 그림책을 만드는 수업 현장을 담았습니다.', youtube: '' },
  { title: '예시 · 기관 홍보 영상', type: 'promo', client: '○○교육지원청', year: '2026', desc: '기관의 교육 프로그램을 3분 안에 소개하는 홍보 영상입니다.', youtube: '' },
  { title: '예시 · 수업용 교육 콘텐츠', type: 'edu', client: '비하이브', year: '2026', desc: '수업 도입부에 쓰는 개념 설명 영상입니다.', youtube: '' }
];
