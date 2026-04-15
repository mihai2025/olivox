"use client";

import { useEffect } from "react";
import { captureSource } from "@/lib/tracking";

export default function SourceCapture() {
  useEffect(() => {
    captureSource();
  }, []);
  return null;
}
