import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SavedListingsClient } from "./SavedListingsClient";

export default function SavedPage() {
  return (
    <>
      <Header />
      <SavedListingsClient />
      <Footer />
    </>
  );
}
