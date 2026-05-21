import { redirect } from "next/navigation";

// Startseite leitet direkt zum Tablet-Homescreen weiter
export default function Home() {
  redirect("/tablet");
}
