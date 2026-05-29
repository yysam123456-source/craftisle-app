/**
 * Image duplicate detection via perceptual hash (average hash / aHash).
 * Compares 2+ images and returns pairwise similarity scores.
 *
 * Algorithm: resize to 16×16 grayscale → compute average pixel value →
 * generate 256-bit hash → compare with Hamming distance.
 */
import sharp from "sharp";

export interface DuplicateResult {
  pairs: {
    file1: string;
    file2: string;
    similarity: number; // 0–1, 1 = identical
    hammingDistance: number;
    verdict: "duplicate" | "similar" | "different";
  }[];
}

/**
 * Compute the aHash of an image buffer.
 * Returns a hex string and the raw Uint8Array for comparison.
 */
async function computeAHash(buffer: Buffer): Promise<{
  hex: string;
  hash: Uint8Array;
  size: number;
}> {
  const raw = await sharp(buffer)
    .resize(16, 16, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const pixels = new Uint8Array(raw);
  const avg = pixels.reduce((sum, v) => sum + v, 0) / pixels.length;
  const hash = new Uint8Array(pixels.length);

  for (let i = 0; i < pixels.length; i++) {
    hash[i] = pixels[i] >= avg ? 1 : 0;
  }

  // Convert to hex string for display
  let hex = "";
  for (let i = 0; i < hash.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < hash.length; j++) {
      byte = (byte << 1) | hash[i + j];
    }
    hex += byte.toString(16).padStart(2, "0");
  }

  return { hex, hash, size: hash.length };
}

/**
 * Compute Hamming distance between two binary hashes.
 */
function hammingDistance(a: Uint8Array, b: Uint8Array): number {
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

/**
 * Compare 2+ images for duplicates.
 * Accepts an array of { name, buffer } pairs.
 */
export async function findDuplicates(
  files: { name: string; buffer: Buffer }[],
): Promise<DuplicateResult> {
  if (files.length < 2) {
    throw new Error("At least 2 files required for comparison");
  }

  // Compute hashes for all files
  const hashed = await Promise.all(
    files.map(async (f) => ({
      name: f.name,
      ...(await computeAHash(f.buffer)),
    })),
  );

  // Compare each pair
  const pairs: DuplicateResult["pairs"] = [];

  for (let i = 0; i < hashed.length; i++) {
    for (let j = i + 1; j < hashed.length; j++) {
      const dist = hammingDistance(hashed[i].hash, hashed[j].hash);
      const maxDist = hashed[i].size;
      const similarity = 1 - dist / maxDist;

      let verdict: DuplicateResult["pairs"][0]["verdict"];
      if (similarity >= 0.95) verdict = "duplicate";
      else if (similarity >= 0.80) verdict = "similar";
      else verdict = "different";

      pairs.push({
        file1: hashed[i].name,
        file2: hashed[j].name,
        similarity: Math.round(similarity * 10000) / 10000,
        hammingDistance: dist,
        verdict,
      });
    }
  }

  return { pairs };
}
