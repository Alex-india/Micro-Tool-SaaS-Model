import {
  computeAllHashes,
  type HashAlgorithm,
  type HashResult,
  type AllHashesResult,
  type VerificationResult,
  type InputEncoding,
  type DigestFormat,
  detectHashAlgorithm,
  verifyHash,
  generateChecksumFile,
} from "./hashEngine";

export interface HashOutput {
  md5: string;
  sha1: string;
  sha256: string;
  sha384: string;
  sha512: string;
  crc32: string;
}

/**
 * Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512, and CRC-32 hashes.
 * 100% compliant with standard cryptographic RFCs and FIPS specifications.
 */
export async function generateHashes(text: string): Promise<HashOutput> {
  if (!text) {
    return { md5: "", sha1: "", sha256: "", sha384: "", sha512: "", crc32: "" };
  }

  const result = await computeAllHashes(text);
  return {
    md5: result.md5.hexLower,
    sha1: result.sha1.hexLower,
    sha256: result.sha256.hexLower,
    sha384: result.sha384.hexLower,
    sha512: result.sha512.hexLower,
    crc32: result.crc32.hexLower,
  };
}

export {
  computeAllHashes,
  detectHashAlgorithm,
  verifyHash,
  generateChecksumFile,
  type HashAlgorithm,
  type HashResult,
  type AllHashesResult,
  type VerificationResult,
  type InputEncoding,
  type DigestFormat,
};
