"use client";

import { useState, useEffect } from "react";
import { DEFAULT_CONFIG, SiteConfig } from "./site-config";

let globalConfig: SiteConfig | null = null;

export function useConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(globalConfig || DEFAULT_CONFIG);

  useEffect(() => {
    if (globalConfig) { setConfig(globalConfig); return; }
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...DEFAULT_CONFIG, ...data };
        globalConfig = merged;
        setConfig(merged);
      })
      .catch(() => {});
  }, []);

  return config;
}
