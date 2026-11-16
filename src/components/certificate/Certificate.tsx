import { GraduationCap } from "lucide-react";
import { fmtDate } from "@/lib/format";

interface Props { learnerName: string; qualificationTitle: string; qabName: string; levelName: string; certificateNumber: string; graduationDate: string }

/** Deterministic QR-*style* pattern (decorative demo visual, not a scannable code). */
function QrStyle({ seed }: { seed: string }) {
  const n = 21;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967295; };
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  const cells: JSX.Element[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!inFinder(x, y) && rand() > 0.5) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  const finder = (ox: number, oy: number) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox} y={oy} width="7" height="7" fill="#0B1730" />
      <rect x={ox + 1} y={oy + 1} width="5" height="5" fill="#fff" />
      <rect x={ox + 2} y={oy + 2} width="3" height="3" fill="#0B1730" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-24 w-24 bg-white" role="img" aria-label="QR-style verification visual (demonstration only)">
      <g fill="#0B1730">{cells}</g>
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
    </svg>
  );
}

export default function Certificate({ learnerName, qualificationTitle, qabName, levelName, certificateNumber, graduationDate }: Props) {
  return (
    <div id="certificate-print" className="relative overflow-hidden rounded-lg border-[6px] border-double border-gold-500 bg-[#FFFDF8] p-6 text-center sm:p-10">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="-rotate-[25deg] select-none text-5xl font-bold uppercase tracking-widest text-navy-900/[0.05] sm:text-7xl">Demo Sample</span>
      </div>
      <div className="relative">
        <p className="mx-auto inline-block rounded border border-rose-400 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-800">
          DEMONSTRATION SAMPLE – NOT AN OFFICIAL KNQA CERTIFICATE
        </p>
        <GraduationCap className="mx-auto mt-5 h-10 w-10 text-gold-500" aria-hidden />
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-navy-700">NAQMIS Prototype · Graduation Certificate</p>
        <p className="mt-6 text-sm text-slate-600">This is to certify that</p>
        <h3 className="mt-2 text-3xl font-semibold text-navy-900 sm:text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{learnerName}</h3>
        <p className="mt-4 text-sm text-slate-600">has successfully completed the requirements for</p>
        <p className="mt-2 text-xl font-semibold text-navy-800 sm:text-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{qualificationTitle}</p>
        <p className="mt-2 text-sm text-slate-700">{levelName}</p>
        <p className="mt-4 text-sm text-slate-600">awarded by</p>
        <p className="font-medium text-navy-900">{qabName}</p>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6 text-left">
          <dl className="space-y-1 text-sm">
            <div><dt className="inline text-slate-500">Certificate no.: </dt><dd className="inline font-mono font-semibold">{certificateNumber}</dd></div>
            <div><dt className="inline text-slate-500">Graduation date: </dt><dd className="inline font-semibold">{fmtDate(graduationDate)}</dd></div>
            <div><dt className="inline text-slate-500">Verification ref.: </dt><dd className="inline font-mono text-xs">VERIFY-{certificateNumber.slice(-9)}</dd></div>
          </dl>
          <div className="flex flex-col items-center gap-1">
            <QrStyle seed={certificateNumber} />
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Verification (demo)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
