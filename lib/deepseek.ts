import env from "@/lib/config/env";

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekChatCompletionRequest = {
  model?: string;
  messages: DeepSeekMessage[];
  response_format?: {
    type: "json_object";
  };
  temperature?: number;
};

type DeepSeekChatCompletionResponse = {
  choices: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const deepseekTimeoutMs = 12000;

async function createChatCompletion(
  payload: DeepSeekChatCompletionRequest
): Promise<DeepSeekChatCompletionResponse> {
  if (!env.deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`timeout_${deepseekTimeoutMs}`)), deepseekTimeoutMs);

  try {
    const response = await fetch(`${env.deepseekBaseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: payload.model ?? env.deepseekModel,
        temperature: payload.temperature ?? 0.1,
        messages: payload.messages,
        response_format: payload.response_format
      }),
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`DeepSeek request failed: ${response.status}`);
    }

    return (await response.json()) as DeepSeekChatCompletionResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const deepseek = {
  chat: {
    completions: {
      create: createChatCompletion
    }
  }
};

