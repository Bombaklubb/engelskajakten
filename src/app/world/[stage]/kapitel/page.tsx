import KapitelClient from "./KapitelClient";
import { stageParams } from "@/lib/staticParams";

// En sida per värld för alla kapitel. Vilket kapitel som visas står efter # i
// adressen, se KapitelClient.
export const dynamicParams = false;

export function generateStaticParams() {
  return stageParams();
}

export default function KapitelPage({ params }: { params: Promise<{ stage: string }> }) {
  return <KapitelClient params={params} />;
}
