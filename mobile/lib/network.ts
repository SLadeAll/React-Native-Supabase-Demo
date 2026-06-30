// Hermes Bridgeless (the engine Expo Go uses on RN 0.85) doesn't support
// the Chrome DevTools Protocol, so the usual "Open JS Debugger" Network tab
// isn't available. This logs every request/response to the Metro console
// instead, which is reachable in any setup.
export async function loggedFetch(input: string, init?: RequestInit) {
  const method = init?.method ?? 'GET';
  const start = Date.now();
  console.log(`[network] -> ${method} ${input}`);
  try {
    const response = await fetch(input, init);
    console.log(`[network] <- ${method} ${input} ${response.status} (${Date.now() - start}ms)`);
    return response;
  } catch (err) {
    console.log(`[network] x  ${method} ${input} failed: ${err instanceof Error ? err.message : err}`);
    throw err;
  }
}
