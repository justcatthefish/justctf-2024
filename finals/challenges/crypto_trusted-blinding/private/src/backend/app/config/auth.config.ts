export const config = {
  secret: process.env.JWT_SECRET as string || "debugjwtsecret",
  rev_proxy_secret: process.env.REV_PROXY_SECRET as string || "",
  github_token: process.env.GITHUB_TOKEN as string || "",
  challenge_prefix_len: Number(process.env.CHALL_PREF_LEN as string) || 16,
  challenge_difficulty: Number(process.env.CHALL_DIFF as string) || 22,
};
