import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import Monaco Editor to reduce bundle size
export const DynamicMonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => {
    // Return a wrapper component
    const Editor = mod.default;
    return {
      default: (props: any) => <Editor {...props} />,
    };
  }),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-64" />,
  }
);

export const DynamicMonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => {
    const DiffEditor = mod.DiffEditor;
    return {
      default: (props: any) => <DiffEditor {...props} />,
    };
  }),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-64" />,
  }
);
