"use client";

import { useEffect } from "react";

export function TitleSetter({ title }: { title: string }) {
  useEffect(() => {
    console.log("TitleSetter: setting title to", title);
    document.title = title;
  }, [title]);
  return <div data-title-setter="true" style={{ display: 'none' }} />;
}
