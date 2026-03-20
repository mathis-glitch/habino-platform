import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MarketClient from "./MarketClient";

export default function MarktPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <MarketClient />
      </main>
      <Footer />
    </>
  );
}
