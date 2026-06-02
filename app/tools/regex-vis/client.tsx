"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ArrowUpIcon, ViewVerticalIcon } from "@radix-ui/react-icons";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffectOnce, useLocalStorage, useUpdateEffect } from "react-use";
import { useCopyToClipboard } from "usehooks-ts";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import RegexInput from "@/lib/regex-vis/home/regex-input";
import { gen, parse } from "@/lib/regex-vis/parser";
import Graph from "@/lib/regex-vis/graph";
import type { Tab } from "@/lib/regex-vis/editor";
import Editor from "@/lib/regex-vis/editor";
import { useCurrentState } from "@/lib/regex-vis/utils/hooks";
import { genPermalink } from "@/lib/regex-vis/utils/helpers";
import {
  SEARCH_PARAM_REGEX,
  SEARCH_PARAM_TESTS,
  STORAGE_GRAPH_TIP_VISIBLE,
  STORAGE_TEST_CASES,
} from "@/lib/regex-vis/constants";
import {
  astAtom,
  clearSelectedAtom,
  selectedIdsAtom,
  updateFlagsAtom,
} from "@/lib/regex-vis/atom";
import { useToast } from "@/lib/regex-vis/components/ui/use-toast";
import { Toggle } from "@/lib/regex-vis/components/ui/toggle";
import { ScrollArea, ScrollBar } from "@/lib/regex-vis/components/ui/scroll-area";

export default function RegexVisClient() {
  const nextSearchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [ast, setAst] = useAtom(astAtom);
  const selectIds = useAtomValue(selectedIdsAtom);
  const clearSelected = useSetAtom(clearSelectedAtom);
  const updateFlags = useSetAtom(updateFlagsAtom);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();

  const [, setCases] = useLocalStorage<string[]>(STORAGE_TEST_CASES, [""]);
  const [graphTipVisible, setGraphTipVisible] = useLocalStorage<boolean>(
    STORAGE_GRAPH_TIP_VISIBLE,
    true
  );
  const shouldGenAst = useRef(true);
  const shouldParseRegex = useRef(true);

  const [editorDefaultTab, setEditorDefaultTab] = useState<Tab>("legend");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [regex, setRegex, regexRef] = useCurrentState<string>(
    () => nextSearchParams.get(SEARCH_PARAM_REGEX) || ""
  );

  const { literal } = ast;

  // Helper: update URL search params (Next.js style)
  const updateSearchParams = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(nextSearchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        sp.delete(key);
      } else {
        sp.set(key, value);
      }
    });
    const qs = sp.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
  };

  useEffect(() => {
    if (nextSearchParams.get(SEARCH_PARAM_REGEX) === null) {
      setRegex("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffectOnce(() => {
    if (nextSearchParams.get(SEARCH_PARAM_TESTS)) {
      try {
        const cases = JSON.parse(
          nextSearchParams.get(SEARCH_PARAM_TESTS) || ""
        );
        if (Array.isArray(cases) && cases.length > 0) {
          setEditorDefaultTab("test");
          setCases(cases);
        }
      } catch (error) {
        console.error(error);
      }
    }
  });

  useEffect(() => {
    if (!shouldParseRegex.current) {
      shouldParseRegex.current = true;
      return;
    }
    const parsed = parse(regex);
    clearSelected();
    if (parsed.type === "regex") {
      setErrorMsg(null);
      setAst(parsed);
      shouldGenAst.current = false;
    } else {
      setErrorMsg(parsed.message);
    }
  }, [regex, setAst, clearSelected]);

  useEffect(() => {
    // update url search
    updateSearchParams({ r: regex !== "" ? regex : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regex]);

  useUpdateEffect(() => {
    if (shouldGenAst.current) {
      const nextRegex = gen(ast);
      if (nextRegex !== regexRef.current) {
        setRegex(nextRegex);
        shouldParseRegex.current = false;
      }
    } else {
      shouldGenAst.current = true;
    }
  }, [ast]);

  useEffect(() => {
    if (graphTipVisible && selectIds.length > 0) {
      setGraphTipVisible(false);
    }
  }, [selectIds, graphTipVisible, setGraphTipVisible]);

  const handleFlagsChange = (flags: string[]) => updateFlags(flags);

  const handleCopyPermalink = () => {
    const permalink = genPermalink();
    copy(permalink);
    toast({ description: t("Permalink copied.") });
  };

  const graphShow = regex !== "" || (ast.body.length > 0 && !errorMsg);
  return (
    <div className="flex-1 flex min-h-0">
      <div
        className={clsx(
          "flex-1 relative flex flex-col min-w-0 bg-graph-bg",
          { "justify-center": !graphShow }
        )}
      >
        {graphShow && (
          <ScrollArea className="flex-1 min-h-0 h-full relative">
            {graphTipVisible && (
              <div className="absolute bg-graph-bg bottom-0 left-1/2 -translate-x-1/2 z-10 text-sm inline-flex items-center py-1">
                <ArrowUpIcon className="w-4 h-4 mr-2" />
                {t("You can select nodes by dragging or clicking on the graph")}
              </div>
            )}
            <div className="flex items-center justify-center p-8 h-full">
              <Graph regex={regex} ast={ast} errorMsg={errorMsg} />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
        <RegexInput
          regex={regex}
          literal={literal}
          flags={ast.flags}
          onChange={setRegex}
          onFlagsChange={handleFlagsChange}
          onCopy={handleCopyPermalink}
          className={clsx({ "border-t": graphShow })}
        />
        <Toggle
          size="sm"
          className="absolute top-2 right-2"
          pressed={!editorCollapsed}
          onPressedChange={(pressed: boolean) =>
            setEditorCollapsed(!pressed)
          }
        >
          <ViewVerticalIcon />
        </Toggle>
      </div>
      {regex !== null && (
        <Editor defaultTab={editorDefaultTab} collapsed={editorCollapsed} />
      )}
    </div>
  );
}
