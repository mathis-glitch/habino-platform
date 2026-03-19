import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AIChatPage } from "./components/chat/AIChatPage";

export default function HomePage() {
  return (
    <>
      <Header />
      <AIChatPage />
      <Footer />
    </>
  );
}
