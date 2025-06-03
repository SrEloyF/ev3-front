export function getTokenFromCookie() {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='));
  return cookie ? cookie.split('=')[1] : null;
}

export function decodePayload(token: string) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}
