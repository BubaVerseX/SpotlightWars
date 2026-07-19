"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PresenceChannel } from "pusher-js";
import { getRpsPusherClient, setRpsAuthProfile } from "@/lib/rps/pusher-client";
import {
  CHOOSE_SECONDS,
  COUNTDOWN_SECONDS,
  MOVES,
  NEXT_ROUND_DELAY_MS,
  REVEAL_DURATION_MS,
  RPS_REMATCH_EVENT,
  RPS_REVEAL_EVENT,
  rpsMatchChannel,
} from "@/lib/rps/constants";
import { useRpsName } from "@/lib/rps/use-name";
import { createDefaultProfile, DEFAULT_ANIMATION, DEFAULT_SKIN } from "@/lib/rps/cosmetics";
import type { Move, PlayerProfile, RoundRevealPayload } from "@/lib/rps/types";
import { MoveButton } from "./MoveButton";
import { RevealStage } from "./RevealStage";
import { ResultBanner } from "./ResultBanner";
import { MatchResultBanner } from "./MatchResultBanner";
import { ScoreTracker } from "./ScoreTracker";
import { PlayerBadge } from "./PlayerBadge";
import { VictoryAnimation } from "./VictoryAnimation";
import { UnlockToast } from "./UnlockToast";
import { Footer } from "@/components/Footer";

type Phase =
  | "loading"
  | "unavailable"
  | "waiting"
  | "full"
  | "countdown"
  | "choosing"
  | "revealing"
  | "roundResult"
  | "matchResult"
  | "disconnected";

interface PresenceMember {
  id: string;
  info?: {
    name?: string;
    equippedSkin?: string;
    equippedAnimation?: string;
    equippedTitle?: string;
    elo?: number;
  };
}

interface OpponentInfo {
  name: string;
  equippedSkin: string;
  equippedAnimation: string;
  equippedTitle: string | null;
  elo?: number;
}

export function MatchRoom({ matchId }: { matchId: string }) {
  const { name } = useRpsName();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [opponentInfo, setOpponentInfo] = useState<OpponentInfo | null>(null);
  const [opponentMemberId, setOpponentMemberId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [myMove, setMyMove] = useState<Move | null>(null);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [roundWinnerId, setRoundWinnerId] = useState<string | null>(null);
  const [scoreByMemberId, setScoreByMemberId] = useState<Record<string, number>>({});
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);
  const [myEloBefore, setMyEloBefore] = useState<number | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<PlayerProfile | null>(null);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
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

  // Load (or lazily create) my profile so we know my equipped cosmetics and
  // current ELO before authorizing the presence channel, then subscribe.
  // Membership tells us who the opponent is (and their loadout, embedded in
  // their own auth call) and lets us detect disconnects; server-triggered
  // events carry the actual game state (reveal, rematch).
  useEffect(() => {
    if (!name) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      let profile: PlayerProfile;
      try {
        const res = await fetch(`/api/rps/profile?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        profile = data.profile;
      } catch {
        profile = createDefaultProfile(name);
      }
      if (cancelled) return;
      setMyProfile(profile);

      setRpsAuthProfile({
        name,
        equippedSkin: profile.equippedSkin,
        equippedAnimation: profile.equippedAnimation,
        equippedTitle: profile.equippedTitle,
        elo: profile.elo,
      });

      const pusher = getRpsPusherClient();
      if (!pusher) {
        setPhase("unavailable");
        return;
      }

      const channelName = rpsMatchChannel(matchId);
      const channel = pusher.subscribe(channelName) as PresenceChannel;

      const opponentFromMembers = (): { id: string; info: OpponentInfo } | null => {
        let found: { id: string; info: OpponentInfo } | null = null;
        channel.members.each((member: PresenceMember) => {
          if (member.id !== channel.members.myID) {
            found = {
              id: member.id,
              info: {
                name: member.info?.name ?? "Opponent",
                equippedSkin: member.info?.equippedSkin ?? DEFAULT_SKIN,
                equippedAnimation: member.info?.equippedAnimation ?? DEFAULT_ANIMATION,
                equippedTitle: member.info?.equippedTitle ?? null,
                elo: member.info?.elo,
              },
            };
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
          const opponent = opponentFromMembers();
          if (opponent) {
            setOpponentInfo(opponent.info);
            setOpponentMemberId(opponent.id);
          }
          setPhase("countdown");
        } else {
          setPhase("waiting");
        }
      });

      channel.bind("pusher:member_added", () => {
        if (phaseRef.current === "waiting") {
          const opponent = opponentFromMembers();
          if (opponent) {
            setOpponentInfo(opponent.info);
            setOpponentMemberId(opponent.id);
          }
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

      channel.bind(RPS_REVEAL_EVENT, (payload: RoundRevealPayload) => {
        const oppId = Object.keys(payload.moves).find((id) => id !== myMemberIdRef.current);
        setOpponentMove(oppId ? payload.moves[oppId] : null);
        setRoundWinnerId(payload.roundWinnerId);
        setScoreByMemberId(payload.scoreByMemberId);
        setMatchWinnerId(payload.matchWinnerId);

        if (payload.matchWinnerId && payload.matchStats) {
          const myStats = myMemberIdRef.current ? payload.matchStats[myMemberIdRef.current] : undefined;
          if (myStats) {
            setMyEloBefore(myStats.eloBefore);
            setMyProfile((prev) =>
              prev
                ? {
                    ...prev,
                    elo: myStats.eloAfter,
                    wins: payload.matchWinnerId === myMemberIdRef.current ? prev.wins + 1 : prev.wins,
                    losses:
                      payload.matchWinnerId !== myMemberIdRef.current ? prev.losses + 1 : prev.losses,
                    unlockedCosmetics: [
                      ...new Set([...prev.unlockedCosmetics, ...myStats.newUnlocks]),
                    ],
                  }
                : prev
            );
            if (myStats.newUnlocks.length > 0) {
              setNewUnlocks(myStats.newUnlocks);
            }
          }
        }

        setPhase("revealing");
      });

      channel.bind(RPS_REMATCH_EVENT, () => {
        setMyMove(null);
        setOpponentMove(null);
        setRoundWinnerId(null);
        setScoreByMemberId({});
        setMatchWinnerId(null);
        setMyEloBefore(null);
        setRoundKey((k) => k + 1);
        setPhase("countdown");
      });

      cleanup = () => {
        channel.unbind_all();
        pusher.unsubscribe(channelName);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
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
      if (matchWinnerId) {
        setPhase("matchResult");
      } else {
        setMyMove(null);
        setOpponentMove(null);
        setRoundWinnerId(null);
        setRoundKey((k) => k + 1);
        setPhase("countdown");
      }
    }, NEXT_ROUND_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, matchWinnerId]);

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
          onClick={() => router.push("/")}
          className="arcade-btn-solid rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
        >
          Back to Home
        </button>
      </main>
    );
  }

  const roundOutcome: "win" | "lose" | "draw" =
    roundWinnerId === null ? "draw" : roundWinnerId === myMemberId ? "win" : "lose";
  const matchOutcome: "win" | "lose" = matchWinnerId === myMemberId ? "win" : "lose";
  const myScore = myMemberId ? (scoreByMemberId[myMemberId] ?? 0) : 0;
  const opponentScore = opponentMemberId ? (scoreByMemberId[opponentMemberId] ?? 0) : 0;
  const winnerAnimation =
    roundWinnerId === myMemberId
      ? myProfile?.equippedAnimation
      : roundWinnerId === opponentMemberId
        ? opponentInfo?.equippedAnimation
        : undefined;

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        {phase === "loading" && <p className="text-muted">Connecting...</p>}

        {phase === "unavailable" && (
          <div className="arcade-panel-magenta max-w-sm space-y-4 rounded-lg p-6">
            <p
              className="font-display text-2xl font-bold uppercase tracking-wide"
              style={{ color: "var(--neon-magenta)" }}
            >
              Multiplayer unavailable
            </p>
            <p className="text-sm text-muted">
              Pusher isn&apos;t configured yet, so live matches can&apos;t connect. Add your API
              keys to .env.local and restart the dev server.
            </p>
          </div>
        )}

        {phase === "waiting" && (
          <div className="arcade-panel space-y-4 rounded-lg p-6">
            <p className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Waiting for an opponent...
            </p>
            <p className="text-sm text-muted">
              Share your challenge link, or hang tight if you&apos;re in the random queue.
            </p>
          </div>
        )}

        {phase === "full" && (
          <div className="arcade-panel-magenta space-y-4 rounded-lg p-6">
            <p
              className="font-display text-2xl font-bold uppercase tracking-wide"
              style={{ color: "var(--neon-magenta)" }}
            >
              This match room is full
            </p>
            <button
              onClick={() => router.push("/")}
              className="arcade-btn-solid rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
            >
              Back to Home
            </button>
          </div>
        )}

        {phase === "disconnected" && (
          <div className="arcade-panel-magenta space-y-4 rounded-lg p-6">
            <p
              className="font-display text-2xl font-bold uppercase tracking-wide"
              style={{ color: "var(--neon-magenta)" }}
            >
              Opponent disconnected
            </p>
            <button
              onClick={() => router.push("/")}
              className="arcade-btn-solid rounded-lg px-6 py-3 font-display font-semibold uppercase tracking-wide"
            >
              Back to Matchmaking
            </button>
          </div>
        )}

        {phase === "countdown" && opponentInfo && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6">
              <PlayerBadge
                name={name}
                elo={myProfile?.elo}
                equippedTitle={myProfile?.equippedTitle}
                variant="self"
              />
              <span className="text-sm text-muted">vs</span>
              <PlayerBadge
                name={opponentInfo.name}
                elo={opponentInfo.elo}
                equippedTitle={opponentInfo.equippedTitle}
                variant="opponent"
              />
            </div>
            <ScoreTracker
              myName={name}
              myScore={myScore}
              opponentName={opponentInfo.name}
              opponentScore={opponentScore}
            />
            <p
              key={secondsLeft}
              className="arcade-countdown-digit font-display text-8xl font-black"
              style={{ color: "var(--neon-cyan)" }}
            >
              {secondsLeft > 0 ? secondsLeft : "GO"}
            </p>
          </div>
        )}

        {phase === "choosing" && opponentInfo && (
          <div className="w-full max-w-lg space-y-6">
            <ScoreTracker
              myName={name}
              myScore={myScore}
              opponentName={opponentInfo.name}
              opponentScore={opponentScore}
            />
            <p className="text-sm text-muted">
              {myMove
                ? `Locked in. Waiting for ${opponentInfo.name}...`
                : `Pick your move — ${secondsLeft}s`}
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

        {(phase === "revealing" || phase === "roundResult") &&
          myMove &&
          opponentMove &&
          opponentInfo && (
            <div className="space-y-6">
              <ScoreTracker
                myName={name}
                myScore={myScore}
                opponentName={opponentInfo.name}
                opponentScore={opponentScore}
              />
              <div className="relative">
                <RevealStage
                  myName={name}
                  myMove={myMove}
                  mySkin={myProfile?.equippedSkin ?? DEFAULT_SKIN}
                  opponentName={opponentInfo.name}
                  opponentMove={opponentMove}
                  opponentSkin={opponentInfo.equippedSkin}
                  outcome={roundOutcome}
                />
                {winnerAnimation && winnerAnimation !== DEFAULT_ANIMATION && (
                  <VictoryAnimation animation={winnerAnimation} />
                )}
              </div>
              {phase === "roundResult" && !matchWinnerId && <ResultBanner outcome={roundOutcome} />}
            </div>
          )}

        {phase === "matchResult" && myProfile && opponentInfo && (
          <div className="space-y-8">
            <RevealStage
              myName={name}
              myMove={myMove ?? "rock"}
              mySkin={myProfile.equippedSkin}
              opponentName={opponentInfo.name}
              opponentMove={opponentMove ?? "rock"}
              opponentSkin={opponentInfo.equippedSkin}
              outcome={roundOutcome}
            />
            <MatchResultBanner
              outcome={matchOutcome}
              myScore={myScore}
              opponentScore={opponentScore}
              eloBefore={myEloBefore ?? myProfile.elo}
              eloAfter={myProfile.elo}
              onRematch={handleRematch}
              onPlayAgain={() => router.push("/")}
            />
          </div>
        )}
      </main>
      <Footer />
      <UnlockToast cosmeticIds={newUnlocks} onDismiss={() => setNewUnlocks([])} />
    </>
  );
}
