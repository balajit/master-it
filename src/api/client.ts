import createClient from "openapi-fetch";
import type { paths } from "./v1.d.ts";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

const client = createClient<paths>({
  baseUrl: "http://localhost:5000",
  headers: {
    get Authorization() {
      return authToken ? `Bearer ${authToken}` : undefined;
    },
  },
});

export default client;
