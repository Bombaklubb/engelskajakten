import WordSearchModuleClient from "./WordSearchModuleClient";
import { moduleParams, moduleMetadata } from "@/lib/staticParams";
import RequireStudent from "@/components/RequireStudent";

// Byggs statiskt vid deploy, se lib/staticParams.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return moduleParams("wordsearch");
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage, module } = await params;
  return moduleMetadata("wordsearch", stage, module);
}

export default function WordSearchModulePage({ params }: { params: Promise<{ stage: string; module: string }> }) {
  return (
    <RequireStudent>
      <WordSearchModuleClient params={params} />
    </RequireStudent>
  );
}
