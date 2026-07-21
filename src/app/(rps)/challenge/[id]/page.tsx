"use client";

import { useParams } from "next/navigation";
import { ChallengeJoin } from "@/components/rps/ChallengeJoin";

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  return <ChallengeJoin matchId={params.id} />;
}
