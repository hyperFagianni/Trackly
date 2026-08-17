const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Minimal base64 encoder for ASCII input (e.g. "client_id:client_secret" for
 * a Basic Auth header). React Native/Hermes doesn't provide a global `btoa`
 * like browsers do, so this avoids pulling in a dependency just for that.
 */
export function base64Encode(input: string): string {
  let output = '';
  let i = 0;
  while (i < input.length) {
    const byte1 = input.charCodeAt(i++);
    const hasByte2 = i < input.length;
    const byte2 = hasByte2 ? input.charCodeAt(i++) : 0;
    const hasByte3 = i < input.length;
    const byte3 = hasByte3 ? input.charCodeAt(i++) : 0;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;

    output +=
      CHARS[enc1] +
      CHARS[enc2] +
      (hasByte2 ? CHARS[enc3] : '=') +
      (hasByte3 ? CHARS[enc4] : '=');
  }
  return output;
}
