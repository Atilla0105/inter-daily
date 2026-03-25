import env from "@/lib/config/env";

export function isAuthorizedCron(request: Request) {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return env.cronSecret !== "" && authHeader === `Bearer ${env.cronSecret}`;
}
