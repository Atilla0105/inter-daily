import env from "@/lib/config/env";

export function isAuthorizedCron(request: Request) {
  if (!env.cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${env.cronSecret}`;
}
