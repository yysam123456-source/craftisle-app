// ============================================================
// File Viewer — shared type definitions
// Used by: craftisle-app (Next.js) ↔ Cloudflare Pages (static viewer)
// Protocol version must be incremented on breaking changes
// ============================================================

/** Current postMessage protocol version. Increment on breaking changes. */
export const PROTOCOL_VERSION = 1;

/** postMessage direction: parent → iframe */
export interface FileViewerMessage {
  type: "file-viewer:file";
  version: number;
  /** File metadata to display in viewer header */
  file: {
    name: string;
    size: number;
    type: string; // MIME type, e.g. "application/pdf"
  };
  /** Blob URL or direct HTTPS URL to the file content */
  url: string;
}

/** postMessage direction: iframe → parent */
export interface FileViewerResponse {
  type: "file-viewer:ready" | "file-viewer:error" | "file-viewer:loaded";
  payload?: {
    error?: string;
    /** Supported formats from viewer (informational) */
    formats?: string[];
  };
}

/** Handshake: iframe sends version on load, parent validates compatibility */
export interface ViewerHandshake {
  type: "file-viewer:handshake";
  version: number;
  capabilities?: string[];
}

/** Union of all incoming messages from iframe */
export type IncomingMessage = FileViewerResponse | ViewerHandshake;

/** File viewer states */
export type ViewerStatus =
  | "idle"       // No file selected
  | "selecting"  // File being selected (drag hover / URL input)
  | "loading"    // File being processed (Blob URL creation / iframe loading)
  | "ready"      // File rendered in viewer
  | "error";     // Error state

/** Error sub-type for precise user feedback */
export type ErrorType =
  | "FILE_TOO_LARGE"     // > 50 MB
  | "FILE_UNSUPPORTED"   // Unknown format
  | "FILE_CORRUPT"       // File can't be parsed
  | "VIEWER_UNAVAILABLE" // iframe failed to load / timeout
  | "CORS_BLOCKED"       // Remote URL CORS blocked
  | "FETCH_TIMEOUT"      // Remote URL fetch timeout
  | "BROWSER_UNSUPPORTED" // FileReader / Blob not available
  | "UNKNOWN";

export interface ViewerError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

/** File info displayed to user */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  /** Extension extracted from filename */
  extension: string;
}

/** Action types for useReducer */
export type ViewerAction =
  | { type: "SELECT_FILE"; file: FileInfo }
  | { type: "SET_URL"; url: string }
  | { type: "SET_BLOB_URL"; blobUrl: string }
  | { type: "START_LOADING" }
  | { type: "VIEWER_READY" }
  | { type: "VIEWER_LOADED" }
  | { type: "VIEWER_ERROR"; error: ViewerError }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "CANCEL" }
  | { type: "RESET" };

/** Reducer state */
export interface ViewerState {
  status: ViewerStatus;
  fileInfo: FileInfo | null;
  blobUrl: string | null;
  remoteUrl: string | null;
  error: ViewerError | null;
  progress: number; // 0-100
}
