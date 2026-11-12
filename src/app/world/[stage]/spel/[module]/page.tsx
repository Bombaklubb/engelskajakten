import SpelModuleClient from "./SpelModuleClient";
import { moduleParams, moduleMetadata } from "@/lib/staticParams";
import RequireStudent from "@/components/RequireStudent";

// Byggs statiskt vid deploy, se lib/staticParams.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return moduleParams("spel");
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage, module } = await params;
  return moduleMetadata("spel", stage, module);
}

export default function SpelModulePage({ params }: { params: Promise<{ stage: string; module: string }> }) {
  return (
    <RequireStudent>
      <SpelModuleClient params={params} />
    </RequireStudent>
  );
}
