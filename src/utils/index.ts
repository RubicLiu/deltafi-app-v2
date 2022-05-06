export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function reportError(err: unknown, context: string) {
  if (err instanceof Error) {
    console.error(context, err);
  }
}

export function isLocalHost() {
  return window.location.hostname === "localhost";
}

export function scheduleWithInterval(func: () => void, delay: number) {
  func();
  const interval = setInterval(func, delay);
  return () => clearInterval(interval);
}
