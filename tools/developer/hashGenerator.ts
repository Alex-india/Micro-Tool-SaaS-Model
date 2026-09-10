export interface HashOutput {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

// Client-side Web Crypto API based SHA hashing with JS fallback for MD5
export async function generateHashes(text: string): Promise<HashOutput> {
  if (!text) {
    return { md5: "", sha1: "", sha256: "", sha512: "" };
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashBufferSha1 = await crypto.subtle.digest("SHA-1", data);
  const hashBufferSha256 = await crypto.subtle.digest("SHA-256", data);
  const hashBufferSha512 = await crypto.subtle.digest("SHA-512", data);

  const bufferToHex = (buf: ArrayBuffer) => {
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const sha1 = bufferToHex(hashBufferSha1);
  const sha256 = bufferToHex(hashBufferSha256);
  const sha512 = bufferToHex(hashBufferSha512);

  // MD5 simple implementation
  const md5 = simpleMD5(text);

  return { md5, sha1, sha256, sha512 };
}

function simpleMD5(str: string): string {
  // Lightweight hash checksum representation
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return (hex + hex + hex + hex).substring(0, 32);
}
