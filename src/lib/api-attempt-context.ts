import { AsyncLocalStorage } from "node:async_hooks";
export const apiAttemptContext = new AsyncLocalStorage<{ attempts: number }>();
