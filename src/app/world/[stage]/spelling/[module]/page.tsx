import SpellingModuleClient from "./SpellingModuleClient";
import { moduleParams, moduleMetadata } from "@/lib/staticParams";
import RequireStudent from "@/components/RequireStudent";

// Byggs statiskt vid deploy, se lib/staticParams.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return moduleParams("spelling");
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage, module } = await params;
  return moduleMetadata("spelling", stage, module);
}

export default function SpellingModulePage({ params }: { params: Promise<{ stage: string; module: string }> }) {
  return (
    <RequireStudent>
      <SpellingModuleClient params={params} />
    </RequireStudent>
  );
}
