"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PresenceChannel } from "pusher-js";
import { getRpsPusherClient, setRpsPlayerName } from "@/lib/rps/pusher-client";
import {
  CHOOSE_SECONDS,
  COUNTDOWN_SECONDS,
  MOVES,
  REVEAL_DURATION_MS,
  RPS_REMATCH_EVENT,
  RPS_REVEAL_EVENT,
  rpsMatchChannel,
} from "@/lib/rps/constants";
import { useRpsName } from "@/lib/rps/use-name";
import type { Move } from "@/lib/rps/types";
import { MoveButton } from "./MoveButton";
import { RevealStage } from "./RevealStage";
import { ResultBanner } from "./ResultBanner";
import { Footer } from "@/components/Footer";

type Phase =
  | "loading"
  | "unavailable"
  | "waiting"
  | "full"
  | "countdown"
  | "choosing"
  | "revealing"
  | "result"
  | "disconnected";

interface PresenceMember {
  id: string;
  info?: { name?: string };
}

interface RevealEventPayload {
  moves: Record<string, Move>;
  winnerId: string | null;
}

export function MatchRoom({ matchId }: { matchId: string }) {
  const { name } = useRpsName();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [myMove, setMyMove] = useState<Move | null>(null);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [roundKey, setRoundKey] = useState(0);

  const myMoveRef = useRef<Move | null>(null);
  const myMemberIdRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("loading");

  useEffect(() => {
    myMoveRef.current = myMove;
  }, [myMove]);
  useEffect(() => {
    myMemberIdRef.current = myMemberId;
  }, [myMemberId]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const submitMove = useCallback(
    async (move: Move) => {
      if (myMoveRef.current || !name || !myMemberIdRef.current) return;
      setMyMove(move);
      try {
        await fetch("/api/rps/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, memberId: myMemberIdRef.current, name, move }),
        });
      } catch {
        // If this fails, the reveal event just never arrives — the round
        // will look stuck rather than crash, and a fresh match can be
        // started from the result/disconnect screens.
      }
    },
    [matchId, name]
  );

  // Subscribe to the match's presence channel: membership tells us who the
  // opponent is and lets us detect disconnects. Server-triggered events
  // carry the actual game state (reveal, rematch).
  useEffect(() => {
    if (!name) return;

    setRpsPlayerName(name);
    const pusher = getRpsPusherClient();
    if (!pusher) {
      setPhase("unavailable");
      return;
    }

    const channelName = rpsMatchChannel(matchId);
    const channel = pusher.subscribe(channelName) as PresenceChannel;

    const opponentFromMembers = (): string | null => {
      let found: string | null = null;
      channel.members.each((member: PresenceMember) => {
        if (member.id !== channel.members.myID) {
          found = member.info?.name ?? "Opponent";
        }
      });
      return found;
    };

    channel.bind("pusher:subscription_succeeded", () => {
      setMyMemberId(channel.members.myID);
      const count = channel.members.count;
      if (count >= 3) {
        setPhase("full");
      } else if (count === 2) {
        setOpponentName(opponentFromMembers());
        setPhase("countdown");
      } else {
        setPhase("waiting");
      }
    });

    channel.bind("pusher:member_added", () => {
      if (phaseRef.current === "waiting") {
        setOpponentName(opponentFromMembers());
        setPhase("countdown");
      } else if (phaseRef.current !== "unavailable" && phaseRef.current !== "loading") {
        setPhase("full");
      }
    });

    channel.bind("pusher:member_removed", () => {
      if (
        phaseRef.current === "waiting" ||
        phaseRef.current === "unavailable" ||
        phaseRef.current === "loading"
      ) {
        return;
      }
      setPhase("disconnected");
    });

    channel.bind(RPS_REVEAL_EVENT, (payload: RevealEventPayload) => {
      const oppId = Object.keys(payload.moves).find((id) => id !== myMemberIdRef.current);
      setOpponentMove(oppId ? payload.moves[oppId] : null);
      setWinnerId(payload.winnerId);
      setPhase("revealing");
    });

    channel.bind(RPS_REMATCH_EVENT, () => {
      setMyMove(null);
      setOpponentMove(null);
      setWinnerId(null);
      setRoundKey((k) => k + 1);
      setPhase("countdown");
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [matchId, name]);

  // 3-2-1 countdown before each round.
  useEffect(() => {
    if (phase !== "countdown") return;
    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setPhase("choosing");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, roundKey]);

  // 10-second window to choose; auto-pick a random move on timeout.
  useEffect(() => {
    if (phase !== "choosing") return;
    setSecondsLeft(CHOOSE_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!myMoveRef.current) {
            submitMove(MOVES[Math.floor(Math.random() * MOVES.length)]);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, roundKey, submitMove]);

  // Hold the reveal animation on screen briefly, then show the result banner.
  useEffect(() => {
    if (phase !== "revealing") return;
    const timer = setTimeout(() => setPhase("result"), REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleRematch = useCallback(async () => {
    await fetch("/api/rps/rematch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
  }, [matchId]);

  if (!name) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <p className="text-muted">Enter a name on the home page first.</p>
        <button
          onClick={() => router.push("/rps")}
          className="rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background"
        >
          Back to Home
        </button>
      </main>
    );
  }

  const outcome: "win" | "lose" | "draw" =
    winnerId === null ? "draw" : winnerId === myMemberId ? "win" : "lose";

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        {phase === "loading" && <p className="text-muted">Connecting...</p>}

        {phase === "unavailable" && (
          <div className="space-y-4">
            <p className="font-display text-2xl font-bold text-foreground">
              Multiplayer unavailable
            </p>
            <p className="max-w-sm text-sm text-muted">
              Pusher isn&apos;t configured yet, so live matches can&apos;t connect. Add your API
              keys to .env.local and restart the dev server.
            </p>
          </div>
        )}

        {phase === "waiting" && (
          <div className="space-y-4">
            <p className="font-display text-2xl font-bold text-foreground">
              Waiting for an opponent...
            </p>
            <p className="text-sm text-muted">
              Share your challenge link, or hang tight if you&apos;re in the random queue.
            </p>
          </div>
        )}

        {phase === "full" && (
          <div className="space-y-4">
            <p className="font-display text-2xl font-bold text-foreground">
              This match room is full
            </p>
            <button
              onClick={() => router.push("/rps")}
              className="rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background"
            >
              Back to Home
            </button>
          </div>
        )}

        {phase === "disconnected" && (
          <div className="space-y-4">
            <p className="font-display text-2xl font-bold text-foreground">
              Opponent disconnected
            </p>
            <button
              onClick={() => router.push("/rps")}
              className="rounded-xl bg-accent px-6 py-3 font-display font-semibold text-background"
            >
              Back to Matchmaking
            </button>
          </div>
        )}

        {phase === "countdown" && opponentName && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Opponent found: {opponentName}</p>
            <p className="font-display text-7xl font-bold text-accent glow-text">
              {secondsLeft > 0 ? secondsLeft : "GO"}
            </p>
          </div>
        )}

        {phase === "choosing" && opponentName && (
          <div className="w-full max-w-lg space-y-6">
            <p className="text-sm text-muted">
              {myMove
                ? `Locked in. Waiting for ${opponentName}...`
                : `Pick your move — ${secondsLeft}s`}
            </p>
            <div className="flex justify-center gap-4">
              {MOVES.map((move) => (
                <MoveButton
                  key={move}
                  move={move}
                  selected={myMove === move}
                  disabled={myMove !== null}
                  onSelect={submitMove}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "revealing" && myMove && opponentMove && opponentName && (
          <RevealStage
            myName={name}
            myMove={myMove}
            opponentName={opponentName}
            opponentMove={opponentMove}
            outcome={outcome}
          />
        )}

        {phase === "result" && myMove && opponentMove && opponentName && (
          <div className="space-y-8">
            <RevealStage
              myName={name}
              myMove={myMove}
              opponentName={opponentName}
              opponentMove={opponentMove}
              outcome={outcome}
            />
            <ResultBanner
              outcome={outcome}
              primaryLabel={outcome === "draw" ? "Rematch" : "Play Again"}
              onPrimaryAction={outcome === "draw" ? handleRematch : () => router.push("/rps")}
            />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
