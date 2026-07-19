"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CHOOSE_SECONDS,
  COUNTDOWN_SECONDS,
  MOVES,
  NEXT_ROUND_DELAY_MS,
  REVEAL_DURATION_MS,
  ROUNDS_TO_WIN,
} from "@/lib/rps/constants";
import { decideWinner } from "@/lib/rps/game";
import { AI_DIFFICULTY_LABEL, pickAiMove } from "@/lib/rps/ai";
import { useRpsIdentity } from "@/lib/rps/use-identity";
import { createDefaultProfile, DEFAULT_SKIN } from "@/lib/rps/cosmetics";
import type { AiDifficulty, Move, PlayerProfile } from "@/lib/rps/types";
import { MoveButton } from "./MoveButton";
import { RevealStage } from "./RevealStage";
import { ResultBanner } from "./ResultBanner";
import { ComputerMatchResultBanner } from "./ComputerMatchResultBanner";
import { ScoreTracker } from "./ScoreTracker";
import { PlayerBadge } from "./PlayerBadge";
import { VictoryAnimation } from "./VictoryAnimation";
import { UnlockToast } from "./UnlockToast";
import { Footer } from "@/components/Footer";

type Phase = "countdown" | "choosing" | "revealing" | "roundResult" | "matchResult";

const AI_NAME_BY_DIFFICULTY: Record<AiDifficulty, string> = {
  easy: "Easy Bot",
  medium: "Medium Bot",
  hard: "Hard Bot",
  impossible: "Impossible AI",
};

export function ComputerMatchRoom({ difficulty }: { difficulty: AiDifficulty }) {
  const { name, claimToken } = useRpsIdentity();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("countdown");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [myMove, setMyMove] = useState<Move | null>(null);
  const [aiMove, setAiMove] = useState<Move | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<"win" | "lose" | "draw" | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [matchOutcome, setMatchOutcome] = useState<"win" | "lose" | null>(null);
  const [myProfile, setMyProfile] = useState<PlayerProfile | null>(null);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const [roundKey, setRoundKey] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);

  const myMoveRef = useRef<Move | null>(null);
  const aiMoveRef = useRef<Move | null>(null);
  const historyRef = useRef<Move[]>([]);
  const myScoreRef = useRef(0);
  const aiScoreRef = useRef(0);

  useEffect(() => {
    myMoveRef.current = myMove;
  }, [myMove]);
  useEffect(() => {
    myScoreRef.current = myScore;
  }, [myScore]);
  useEffect(() => {
    aiScoreRef.current = aiScore;
  }, [aiScore]);

  // Load my profile for cosmetics display — ELO is never read from or
  // written back to here, since vs-computer matches don't affect it.
  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    const params = new URLSearchParams({ name });
    if (claimToken) params.set("claimToken", claimToken);
    fetch(`/api/rps/profile?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMyProfile(data.profile ?? createDefaultProfile(name));
      })
      .catch(() => {
        if (!cancelled) setMyProfile(createDefaultProfile(name));
      });
    return () => {
      cancelled = true;
    };
  }, [name, claimToken]);

  // Pick the AI's move the moment a round begins, from completed-round
  // history only — the player hasn't chosen anything yet at this point, so
  // no difficulty tier can be "peeking" at the in-progress round.
  useEffect(() => {
    const move = pickAiMove(difficulty, historyRef.current);
    aiMoveRef.current = move;
    setAiMove(move);
  }, [difficulty, roundKey]);

  const resolveRound = useCallback((move: Move) => {
    const ai = aiMoveRef.current;
    if (!ai) return;
    historyRef.current = [...historyRef.current, move];

    const result = decideWinner(move, ai);
    const outcome: "win" | "lose" | "draw" = result === "draw" ? "draw" : result === "A" ? "win" : "lose";
    setRoundOutcome(outcome);

    const nextMyScore = myScoreRef.current + (outcome === "win" ? 1 : 0);
    const nextAiScore = aiScoreRef.current + (outcome === "lose" ? 1 : 0);
    setMyScore(nextMyScore);
    setAiScore(nextAiScore);

    if (nextMyScore >= ROUNDS_TO_WIN || nextAiScore >= ROUNDS_TO_WIN) {
      setMatchOutcome(nextMyScore > nextAiScore ? "win" : "lose");
    }

    setPhase("revealing");
  }, []);

  const submitMove = useCallback(
    (move: Move) => {
      if (myMoveRef.current) return;
      setMyMove(move);
      resolveRound(move);
    },
    [resolveRound]
  );

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

  // Hold the reveal animation on screen briefly, then show the round result.
  useEffect(() => {
    if (phase !== "revealing") return;
    const timer = setTimeout(() => setPhase("roundResult"), REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // After the round result, auto-advance to the next round, or to the final
  // match screen if someone just clinched the best-of-3.
  useEffect(() => {
    if (phase !== "roundResult") return;
    const timer = setTimeout(() => {
      if (matchOutcome) {
        setPhase("matchResult");
      } else {
        setMyMove(null);
        setAiMove(null);
        setRoundOutcome(null);
        setRoundKey((k) => k + 1);
        setPhase("countdown");
      }
    }, NEXT_ROUND_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, matchOutcome]);

  // Persist the vs-computer result once per match — stats + achievements
  // only, never ELO.
  useEffect(() => {
    if (phase !== "matchResult" || !name || !matchOutcome || resultSaved) return;
    setResultSaved(true);
    fetch("/api/rps/vs-computer/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        claimToken,
        difficulty,
        outcome: matchOutcome === "win" ? "win" : "loss",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setMyProfile(data.profile);
        if (data.newUnlocks?.length) setNewUnlocks(data.newUnlocks);
      })
      .catch(() => {
        // Best-effort: if this fails the match still played out fine, the
        // player just won't see this particular win reflected in stats.
      });
  }, [phase, name, claimToken, matchOutcome, difficulty, resultSaved]);

  const handleRematch = useCallback(() => {
    setMyMove(null);
    setAiMove(null);
    setRoundOutcome(null);
    setMyScore(0);
    setAiScore(0);
    setMatchOutcome(null);
    setResultSaved(false);
    historyRef.current = [];
    setRoundKey((k) => k + 1);
    setPhase("countdown");
  }, []);

  if (!name) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <p className="text-muted">Enter a name on the home page first.</p>
        <button
          onClick={() => router.push("/")}
          className="arcade-btn-solid rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
        >
          Back to Home
        </button>
      </main>
    );
  }

  const aiName = AI_NAME_BY_DIFFICULTY[difficulty];
  const winnerAnimation = roundOutcome === "win" ? myProfile?.equippedAnimation : undefined;

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="arcade-panel-magenta inline-flex items-center gap-2 rounded-full px-4 py-1">
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--neon-gold)" }}
          >
            Practice Mode
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {AI_DIFFICULTY_LABEL[difficulty]} AI
          </span>
        </div>

        {phase === "countdown" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6">
              <PlayerBadge name={name} elo={myProfile?.elo} equippedTitle={myProfile?.equippedTitle} variant="self" />
              <span className="text-sm text-muted">vs</span>
              <PlayerBadge name={aiName} variant="opponent" />
            </div>
            <ScoreTracker myName={name} myScore={myScore} opponentName={aiName} opponentScore={aiScore} />
            <p
              key={secondsLeft}
              className="arcade-countdown-digit font-display text-8xl font-black"
              style={{ color: "var(--neon-cyan)" }}
            >
              {secondsLeft > 0 ? secondsLeft : "GO"}
            </p>
          </div>
        )}

        {phase === "choosing" && (
          <div className="w-full max-w-lg space-y-6">
            <ScoreTracker myName={name} myScore={myScore} opponentName={aiName} opponentScore={aiScore} />
            <p className="text-sm text-muted">
              {myMove ? `Locked in. Waiting for ${aiName}...` : `Pick your move — ${secondsLeft}s`}
            </p>
            <div className="flex justify-center gap-4">
              {MOVES.map((move) => (
                <MoveButton
                  key={move}
                  move={move}
                  skin={myProfile?.equippedSkin ?? DEFAULT_SKIN}
                  selected={myMove === move}
                  disabled={myMove !== null}
                  onSelect={submitMove}
                />
              ))}
            </div>
          </div>
        )}

        {(phase === "revealing" || phase === "roundResult") && myMove && aiMove && roundOutcome && (
          <div className="space-y-6">
            <ScoreTracker myName={name} myScore={myScore} opponentName={aiName} opponentScore={aiScore} />
            <div className="relative">
              <RevealStage
                myName={name}
                myMove={myMove}
                mySkin={myProfile?.equippedSkin ?? DEFAULT_SKIN}
                opponentName={aiName}
                opponentMove={aiMove}
                opponentSkin={DEFAULT_SKIN}
                outcome={roundOutcome}
              />
              {winnerAnimation && <VictoryAnimation animation={winnerAnimation} />}
            </div>
            {phase === "roundResult" && !matchOutcome && <ResultBanner outcome={roundOutcome} />}
          </div>
        )}

        {phase === "matchResult" && matchOutcome && (
          <div className="space-y-8">
            <RevealStage
              myName={name}
              myMove={myMove ?? "rock"}
              mySkin={myProfile?.equippedSkin ?? DEFAULT_SKIN}
              opponentName={aiName}
              opponentMove={aiMove ?? "rock"}
              opponentSkin={DEFAULT_SKIN}
              outcome={roundOutcome ?? "draw"}
            />
            <ComputerMatchResultBanner
              outcome={matchOutcome}
              myScore={myScore}
              opponentScore={aiScore}
              difficulty={difficulty}
              onRematch={handleRematch}
              onChangeDifficulty={() => router.push("/")}
            />
          </div>
        )}
      </main>
      <Footer />
      <UnlockToast cosmeticIds={newUnlocks} onDismiss={() => setNewUnlocks([])} />
    </>
  );
}
