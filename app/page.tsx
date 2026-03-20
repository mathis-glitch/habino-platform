import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AIChatPage } from "./components/chat/AIChatPage";

export default function HomePage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <AIChatPage />
      </Suspense>
      <Footer />
    </>
  );
}
