import { redirect } from "next/navigation";

// Legacy route — redirect to /explore
export default function MapPage() {
  redirect("/explore");
}
