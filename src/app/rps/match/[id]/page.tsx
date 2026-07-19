"use client";

import { useParams } from "next/navigation";
import { MatchRoom } from "@/components/rps/MatchRoom";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  return <MatchRoom matchId={params.id} />;
}
