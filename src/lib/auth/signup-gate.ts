// LEO_ALLOW_SIGNUP=0 이면 회원가입을 막는다. 외부에 공개할 때 아무나 가입해 API 비용을 쓰지 못하게 한다.
export function isSignupAllowed(): boolean {
  return process.env.LEO_ALLOW_SIGNUP !== "0";
}
