"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/components/quiz/api";

export function GradeForm({
  attemptId,
  maxScore,
  initialScore,
}: {
  attemptId: string;
  maxScore: number;
  initialScore?: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialScore != null ? String(initialScore) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const score = Number(value);
    if (value.trim() === "" || !Number.isInteger(score) || score < 0 || score > maxScore) {
      setError(`0 dan ${maxScore} gacha butun son kiriting`);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await apiFetch(`/api/attempts/${attemptId}`, "PATCH", { score });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={maxScore}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`0-${maxScore}`}
          className="w-24"
        />
        <Button size="sm" variant="secondary" onClick={() => void save()} disabled={loading}>
          {loading ? "..." : "Baholash"}
        </Button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
