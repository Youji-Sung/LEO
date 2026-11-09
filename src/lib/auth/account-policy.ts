export function canUseAccount(user: { status: string; provisioned: boolean }): boolean {
  return user.status === "active" && (process.env.LEO_INVITE_ONLY === "0" || user.provisioned);
}
