"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ForumReplyDelete({ replyId }: { replyId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Javobni o'chirishni tasdiqlaysizmi?")) return;
    setDeleting(true);
    await fetch(`/api/forum/replies/${replyId}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-slate-600 hover:text-rose-600"
      onClick={handleDelete}
      disabled={deleting}
    >
      O&apos;chirish
    </Button>
  );
}
