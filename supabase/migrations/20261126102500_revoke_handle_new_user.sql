-- 새 계정 트리거 함수는 트리거로만 실행되면 되므로 외부 호출을 막습니다
revoke execute on function public.handle_new_user() from public, anon, authenticated;
