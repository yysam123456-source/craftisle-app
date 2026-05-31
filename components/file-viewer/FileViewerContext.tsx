"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  ViewerState,
  ViewerAction,
  FileInfo,
  ViewerError,
} from "@/types/file-viewer";
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from "@/constants/file-viewer";

// ============================================================
// Initial state
// ============================================================

const initialState: ViewerState = {
  status: "idle",
  fileInfo: null,
  blobUrl: null,
  remoteUrl: null,
  error: null,
  progress: 0,
};

// ============================================================
// Helpers
// ============================================================

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

function getMimeType(extension: string): string {
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".zip": "application/zip",
    ".7z": "application/x-7z-compressed",
    ".rar": "application/x-rar-compressed",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".md": "text/markdown",
    ".epub": "application/epub+zip",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".stl": "model/stl",
    ".obj": "model/obj",
    ".gltf": "model/gltf+json",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
  };
  return map[extension] || "application/octet-stream";
}

// ============================================================
// Reducer
// ============================================================

function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case "SELECT_FILE": {
      const ext = getExtension(action.file.name);

      // Validate
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        return {
          ...initialState,
          status: "error",
          error: {
            type: "FILE_UNSUPPORTED",
            message: `"${ext || "unknown"}" is not a supported format.`,
            retryable: false,
          },
        };
      }

      if (action.file.size > MAX_FILE_SIZE) {
        return {
          ...initialState,
          status: "error",
          error: {
            type: "FILE_TOO_LARGE",
            message: `File exceeds the 50 MB limit (${(action.file.size / 1024 / 1024).toFixed(1)} MB).`,
            retryable: false,
          },
        };
      }

      return {
        ...initialState,
        status: "selecting",
        fileInfo: { ...action.file, extension: ext },
      };
    }

    case "SET_URL":
      return {
        ...initialState,
        status: "selecting",
        remoteUrl: action.url,
      };

    case "START_LOADING":
      return {
        ...state,
        status: "loading",
        error: null,
        progress: 0,
      };

    case "VIEWER_READY":
      return {
        ...state,
        status: "ready",
      };

    case "VIEWER_LOADED":
      return {
        ...state,
        status: "ready",
        progress: 100,
      };

    case "VIEWER_ERROR":
      return {
        ...state,
        status: "error",
        error: action.error,
        blobUrl: null,
      };

    case "SET_PROGRESS":
      return {
        ...state,
        progress: action.progress,
      };

    case "CANCEL":
      // Revoke leaked Blob URL (user cancelled before iframe loaded)
      if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
      }
      return {
        ...state,
        status: "idle",
        blobUrl: null,
        fileInfo: null,
        remoteUrl: null,
        progress: 0,
        error: null,
      };

    case "SET_BLOB_URL":
      return {
        ...state,
        blobUrl: action.blobUrl,
        status: "loading",
        progress: 0,
      };

    case "RESET":
      // Clean up blob URL if any
      if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
      }
      return { ...initialState };

    default:
      return state;
  }
}

// ============================================================
// Separate ProgressContext to avoid full-tree re-renders (E8)
// ============================================================

interface ProgressState {
  progress: number;
  setProgress: (p: number) => void;
}

const ProgressContext = createContext<ProgressState | null>(null);
export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within FileViewerProvider");
  return ctx;
}

// ============================================================
// Main Context
// ============================================================

interface ViewerContextValue {
  state: ViewerState;
  dispatch: Dispatch<ViewerAction>;
  selectFile: (file: File) => void;
  selectUrl: (url: string) => void;
  setBlobUrl: (blobUrl: string) => void;
  startLoading: () => void;
  reset: () => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useFileViewer() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error("useFileViewer must be used within FileViewerProvider");
  return ctx;
}

// ============================================================
// Provider
// ============================================================

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(viewerReducer, initialState);

  // Throttled progress updates via dispatch (ProgressContext isolates re-renders)
  const setProgress = useCallback((p: number) => {
    dispatch({ type: "SET_PROGRESS", progress: p });
  }, []);

  const selectFile = useCallback(
    (file: File) => {
      const ext = getExtension(file.name);
      dispatch({
        type: "SELECT_FILE",
        file: {
          name: file.name,
          size: file.size,
          type: file.type || getMimeType(ext),
          extension: ext,
        },
      });
    },
    []
  );

  const selectUrl = useCallback((url: string) => {
    dispatch({ type: "SET_URL", url });
  }, []);

  const setBlobUrl = useCallback((blobUrl: string) => {
    dispatch({ type: "SET_BLOB_URL", blobUrl });
  }, []);

  const startLoading = useCallback(() => {
    dispatch({ type: "START_LOADING" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <ViewerContext.Provider
      value={{ state, dispatch, selectFile, selectUrl, setBlobUrl, startLoading, reset }}
    >
      <ProgressContext.Provider value={{ progress: state.progress, setProgress }}>
        {children}
      </ProgressContext.Provider>
    </ViewerContext.Provider>
  );
}
