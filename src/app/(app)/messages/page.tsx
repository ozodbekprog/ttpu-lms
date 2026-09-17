import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const initialUserId =
    typeof params.user === "string" && params.user.length > 0 ? params.user : undefined;

  return (
    <>
      <PageHeader eyebrow="Chat" title="Xabarlar" subtitle="Shaxsiy yozishmalar" />
      <ChatClient currentUserId={user.id} initialUserId={initialUserId} />
    </>
  );
}
