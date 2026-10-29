/**
 * Martinsjakters banner på utskrifterna, så att den som får papperet i handen
 * hittar alla apparna. Står på arbetshäftets framsida och sist på
 * välj själv-bladet (före facit). Utseendet styrs av .mj-print i globals.css.
 */
export default function MartinsjakterTag() {
  return (
    <div className="mj-print">
      <img src="/martinsjakter-banner.webp" alt="Martinsjakter" />
      <p>
        Fler gratis övningsappar för klassrummet och hemmet:
        <br />
        <strong>martinsjakter.vercel.app</strong>
      </p>
    </div>
  );
}
