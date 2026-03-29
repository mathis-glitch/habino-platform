import dynamic from "next/dynamic";

// AIChatPage must be client-side (uses browser APIs)
const AIChatPage = dynamic(
  () => import("../components/chat/AIChatPage").then((m) => ({ default: m.AIChatPage })),
  { ssr: false }
);

export default function ExplorePage() {
  return <AIChatPage />;
}
