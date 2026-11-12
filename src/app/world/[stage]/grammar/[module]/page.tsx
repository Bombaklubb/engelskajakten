import GrammarModuleClient from "./GrammarModuleClient";
import { moduleParams, moduleMetadata } from "@/lib/staticParams";
import RequireStudent from "@/components/RequireStudent";

// Byggs statiskt vid deploy, se lib/staticParams.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return moduleParams("grammar");
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage, module } = await params;
  return moduleMetadata("grammar", stage, module);
}

export default function GrammarModulePage({ params }: { params: Promise<{ stage: string; module: string }> }) {
  return (
    <RequireStudent>
      <GrammarModuleClient params={params} />
    </RequireStudent>
  );
}
