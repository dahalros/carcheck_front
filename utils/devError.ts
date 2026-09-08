export function devError(...args: unknown[]): void {
    if (useRuntimeConfig().public.isDev) console.error(...args);
}
