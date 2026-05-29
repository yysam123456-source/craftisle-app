/**
 * Image processing tool type definitions.
 *
 * ToolDefinition provides runtime behavior; ToolMeta (in lib/tools.ts)
 * provides display-layer metadata. Both are linked by tool `id`.
 */

export interface ProcessResult {
  /** Processed image buffer — undefined for info/palette tools */
  buffer?: Buffer;
  /** Output MIME type */
  mimeType: string;
  /** Download filename */
  filename: string;
  /** Arbitrary metadata (e.g. image dimensions, color palette) */
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  /** Unique tool id, matches `tool` param in [tool] routes */
  id: string;
  /** Accepted input MIME types */
  acceptTypes: string[];
  /** Max file size in bytes (Vercel free tier: 4 MB) */
  maxFileSize: number;
  /** Processing function — receives raw buffer + user params */
  processFile: (
    file: Buffer,
    params: Record<string, unknown>,
  ) => Promise<ProcessResult>;
}
