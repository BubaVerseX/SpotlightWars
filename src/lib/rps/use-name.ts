"use client";

import { useCallback, useEffect, useState } from "react";
import { RPS_NAME_STORAGE_KEY } from "./constants";

export function useRpsName() {
  const [name, setNameState] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(RPS_NAME_STORAGE_KEY);
    if (stored) setNameState(stored);
  }, []);

  const setName = useCallback((value: string) => {
    setNameState(value);
    window.localStorage.setItem(RPS_NAME_STORAGE_KEY, value);
  }, []);

  return { name, setName };
}
