"use client";

import { useParams } from "next/navigation";
import { ComputerMatchRoom } from "@/components/rps/ComputerMatchRoom";
import { AI_DIFFICULTIES } from "@/lib/rps/ai";
import type { AiDifficulty } from "@/lib/rps/types";

export default function ComputerPage() {
  const params = useParams<{ difficulty: string }>();
  const difficulty = (AI_DIFFICULTIES as string[]).includes(params.difficulty)
    ? (params.difficulty as AiDifficulty)
    : "easy";
  return <ComputerMatchRoom difficulty={difficulty} />;
}
