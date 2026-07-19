"use client";

import { useCallback, useEffect, useState } from "react";
import type { PresenceChannel } from "pusher-js";
import { getPusherClient } from "@/lib/pusher-client";
import {
  MAX_RECENT_SPOTLIGHTS,
  SPOTLIGHT_CHANNEL,
  SPOTLIGHT_EVENT,
  TAKEOVER_DURATION_MS,
} from "@/lib/constants";
import type { SpotlightPayload } from "@/types/spotlight";
import { LiveCounter } from "@/components/LiveCounter";
import { SpotlightForm } from "@/components/SpotlightForm";
import { PaymentModal } from "@/components/PaymentModal";
import { SpotlightTakeover } from "@/components/SpotlightTakeover";
import { RecentSpotlights } from "@/components/RecentSpotlights";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [realtimeError, setRealtimeError] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentSpotlights, setRecentSpotlights] = useState<SpotlightPayload[]>([]);
  const [queue, setQueue] = useState<SpotlightPayload[]>([]);
  const [currentTakeover, setCurrentTakeover] = useState<SpotlightPayload | null>(null);

  // Subscribe to the shared presence channel: membership drives the live
  // count, and the same channel carries broadcast spotlight events.
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      setRealtimeError(true);
      return;
    }

    const channel = pusher.subscribe(SPOTLIGHT_CHANNEL) as PresenceChannel;

    const updateCount = () => setOnlineCount(channel.members.count);

    channel.bind("pusher:subscription_succeeded", updateCount);
    channel.bind("pusher:member_added", updateCount);
    channel.bind("pusher:member_removed", updateCount);
    channel.bind("pusher:subscription_error", () => setRealtimeError(true));

    channel.bind(SPOTLIGHT_EVENT, (payload: SpotlightPayload) => {
      setRecentSpotlights((prev) => [payload, ...prev].slice(0, MAX_RECENT_SPOTLIGHTS));
      setQueue((prev) => [...prev, payload]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(SPOTLIGHT_CHANNEL);
    };
  }, []);

  // Pull the next queued spotlight onto the screen once the current one clears.
  useEffect(() => {
    if (currentTakeover || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrentTakeover(next);
    setQueue(rest);
  }, [queue, currentTakeover]);

  useEffect(() => {
    if (!currentTakeover) return;
    const timer = setTimeout(() => setCurrentTakeover(null), TAKEOVER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentTakeover]);

  const handleTakeSpotlight = useCallback(() => {
    if (!message.trim()) return;
    setIsModalOpen(true);
  }, [message]);

  const handleConfirmPayment = useCallback(async () => {
    const res = await fetch("/api/spotlight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, name }),
    });

    if (!res.ok) {
      throw new Error("Failed to broadcast spotlight");
    }

    setIsModalOpen(false);
    setMessage("");
    setName("");
  }, [message, name]);

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <LiveCounter count={onlineCount} unavailable={realtimeError} />
        <SpotlightForm
          message={message}
          name={name}
          onMessageChange={setMessage}
          onNameChange={setName}
          onSubmit={handleTakeSpotlight}
        />
        <RecentSpotlights spotlights={recentSpotlights} />
      </main>
      <Footer />
      {isModalOpen && (
        <PaymentModal
          message={message}
          name={name.trim() || "Anonymous"}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
      {currentTakeover && (
        <SpotlightTakeover
          key={currentTakeover.id}
          spotlight={currentTakeover}
          durationMs={TAKEOVER_DURATION_MS}
        />
      )}
    </>
  );
}
