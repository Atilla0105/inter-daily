import { z } from "zod";

import type { ApiEnvelope } from "@/lib/types";

export async function fetchApi<T>(
  input: string,
  schema: z.ZodType<ApiEnvelope<T>>,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  return schema.parse(json);
}
