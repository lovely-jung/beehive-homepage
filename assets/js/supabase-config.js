/* 비하이브 운영 시스템 연결 정보 (공개용)
   - 이 키는 공개용(publishable) 키라 화면 코드에 넣어도 됩니다.
   - 실제 데이터 보호는 데이터베이스의 행 단위 보안(RLS)과 서버 기능이 맡습니다.
   - 비밀 키(service_role / secret)는 절대 이 파일에 넣지 마세요. */
window.BH_SUPABASE = {
  url: 'https://dszmywhmnvbfdxtwzkxh.supabase.co',
  key: 'sb_publishable_Vc3zOWT9ItwSBVZUUsTfEw_5wkJDAjb',
  functions: 'https://dszmywhmnvbfdxtwzkxh.supabase.co/functions/v1'
};
