"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { apiFetch } from "@/components/quiz/api";

export function StartAttemptButton({
  quizId,
  label = "Boshlash",
}: {
  quizId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    const result = await apiFetch<{ attempt: { id: string } }>(
      `/api/quizzes/${quizId}/attempts`,
      "POST",
    );
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/quizzes/${quizId}/attempt?attemptId=${result.data.attempt.id}`);
  }

  return (
    <div>
      <Button onClick={start} disabled={loading}>
        {loading ? "Boshlanmoqda..." : label}
      </Button>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
