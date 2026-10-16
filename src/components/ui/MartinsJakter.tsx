// "Martins jakter" nere till höger: en länk till martinsjakter.vercel.app, där
// alla Martins appar finns samlade. Ersätter den tidigare menyn Jaktlänkar.
export const MARTINS_JAKTER_URL = "https://martinsjakter.vercel.app";

export default function MartinsJakter() {
  return (
    <a
      href={MARTINS_JAKTER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white/85 backdrop-blur-sm shadow-md hover:text-slate-900 hover:bg-white transition-colors dark:bg-gray-900/80 dark:text-slate-200 dark:hover:text-white martins-jakter-ram"
    >
      Martins jakter
    </a>
  );
}
