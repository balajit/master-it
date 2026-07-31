import createClient from "openapi-fetch";
import type { paths } from "./v1.d.ts";

let authToken: string | null = null;

const API_LOGGING_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_API_LOGGING === "true";
const MAX_LOG_BODY_CHARS = 1200;

function maskHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  const normalized = new Headers(headers);
  const out: Record<string, string> = {};

  normalized.forEach((value, key) => {
    if (key.toLowerCase() === "authorization") {
      out[key] = value ? "Bearer ***" : "";
      return;
    }
    out[key] = value;
  });

  return out;
}

function describeRequestBody(body: BodyInit | null | undefined): string {
  if (!body) return "none";
  if (typeof body === "string") {
    return body.length > MAX_LOG_BODY_CHARS
      ? `${body.slice(0, MAX_LOG_BODY_CHARS)}…`
      : body;
  }
  if (body instanceof FormData) {
    const keys = [...body.keys()];
    return `FormData(${keys.join(",")})`;
  }
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  if (body instanceof Blob) {
    return `Blob(${body.type || "unknown"}, ${body.size} bytes)`;
  }
  return Object.prototype.toString.call(body);
}

function logApiRequest(input: RequestInfo | URL, init?: RequestInit) {
  if (!API_LOGGING_ENABLED) return;
  const method = init?.method ?? "GET";
  const url = typeof input === "string" ? input : input.toString();
  console.debug("[api][request]", {
    method,
    url,
    headers: maskHeaders(init?.headers),
    body: describeRequestBody(init?.body),
  });
}

async function logApiResponse(input: RequestInfo | URL, response: Response) {
  if (!API_LOGGING_ENABLED) return;

  const url = typeof input === "string" ? input : input.toString();
  const contentType = response.headers.get("content-type") || "";

  let body = "<not logged>";
  if (contentType.includes("application/json") || contentType.startsWith("text/")) {
    try {
      const text = await response.clone().text();
      body =
        text.length > MAX_LOG_BODY_CHARS
          ? `${text.slice(0, MAX_LOG_BODY_CHARS)}…`
          : text;
    } catch {
      body = "<unavailable>";
    }
  }

  console.debug("[api][response]", {
    url,
    status: response.status,
    ok: response.ok,
    contentType,
    body,
  });
}

const loggingFetch: typeof fetch = async (input, init) => {
  logApiRequest(input, init);
  const response = await fetch(input, init);
  await logApiResponse(input, response);
  return response;
};

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  fetch: loggingFetch,
  headers: {
    get Authorization() {
      return authToken ? `Bearer ${authToken}` : undefined;
    },
  },
});

export default client;
