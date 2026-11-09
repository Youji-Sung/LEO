// 공개 가입은 명시적으로 허용할 때만 열린다. 초대 운영에서는 항상 차단한다.
export function isSignupAllowed(): boolean {
  return process.env.LEO_ALLOW_SIGNUP === "1" && process.env.LEO_INVITE_ONLY === "0";
}
