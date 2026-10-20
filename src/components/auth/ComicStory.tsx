import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * A four-page black-and-white comic about Tempest: a storm of scattered health data turned into
 * one uniform picture and analysed. Drawn in SVG (ink on paper, halftone shading, speech bubbles)
 * and flipped like pages. Colours are fixed so it always reads as a printed page.
 */

const INK = "#1b1b1b";
const PAPER = "#e9e4dc";
const MID = "#9a948a";
const HAND = "'Patrick Hand SC', 'Patrick Hand', cursive";
const FX = "'Bangers', 'Impact', sans-serif";

/* ───────── drawing helpers ───────── */

const Defs = () => (
  <defs>
    <pattern id="ht" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="3" cy="3" r="1.5" fill={INK} />
    </pattern>
    <pattern id="htLight" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="3.5" cy="3.5" r="1.3" fill={PAPER} />
    </pattern>
    <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="1.6" height="7" fill={INK} />
    </pattern>
  </defs>
);

const Panel = ({ x, y, w, h, fill = PAPER, children }: { x: number; y: number; w: number; h: number; fill?: string; children?: ReactNode }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={fill} stroke={INK} strokeWidth={4} />
    <svg x={x} y={y} width={w} height={h} viewBox={`${x} ${y} ${w} ${h}`} overflow="hidden">{children}</svg>
  </g>
);

const Caption = ({ x, y, w, lines }: { x: number; y: number; w: number; lines: string[] }) => (
  <g>
    <rect x={x} y={y} width={w} height={lines.length * 15 + 12} fill={PAPER} stroke={INK} strokeWidth={2} />
    {lines.map((l, i) => (
      <text key={i} x={x + 8} y={y + 19 + i * 15} fontFamily={HAND} fontSize={12.5} fill={INK} letterSpacing={0.3}>{l}</text>
    ))}
  </g>
);

/** Speech bubble: a rounded ellipse with a tail. `tail` is the tip's absolute position. */
const Bubble = ({ cx, cy, rx, ry, lines, tail, size = 13.5 }: { cx: number; cy: number; rx: number; ry: number; lines: string[]; tail: [number, number]; size?: number }) => {
  const baseL = [cx - rx * 0.35, cy + ry * 0.85];
  const baseR = [cx + rx * 0.05, cy + ry * 0.98];
  return (
    <g>
      <path d={`M${baseL[0]},${baseL[1]} L${tail[0]},${tail[1]} L${baseR[0]},${baseR[1]} Z`} fill={PAPER} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={PAPER} stroke={INK} strokeWidth={2.5} />
      <path d={`M${baseL[0] + 2},${baseL[1] - 3} L${baseR[0] - 2},${baseR[1] - 3} L${baseR[0] - 2},${baseR[1] + 3} L${baseL[0] + 2},${baseL[1] + 3} Z`} fill={PAPER} />
      {lines.map((l, i) => (
        <text key={i} x={cx} y={cy - ((lines.length - 1) * (size + 3)) / 2 + i * (size + 3) + size * 0.35} textAnchor="middle" fontFamily={HAND} fontSize={size} fill={INK} letterSpacing={0.3}>{l}</text>
      ))}
    </g>
  );
};

const Sfx = ({ x, y, text, rot = -8, size = 40, fill = PAPER }: { x: number; y: number; text: string; rot?: number; size?: number; fill?: string }) => (
  <g className="comic-pop" style={{ ["--r" as any]: `${rot}deg` }} transform={`translate(${x} ${y}) rotate(${rot})`}>
    <text textAnchor="middle" fontFamily={FX} fontSize={size} letterSpacing={2} fill={fill} stroke={INK} strokeWidth={size / 7} paintOrder="stroke" strokeLinejoin="round">{text}</text>
  </g>
);

/* ───────── page 1: the storm gathers ───────── */

const spiralDots = () => {
  const dots: { x: number; y: number; r: number }[] = [];
  const arms = 4;
  for (let a = 0; a < arms; a++) {
    for (let i = 0; i < 46; i++) {
      const t = i / 45;
      const ang = a * ((Math.PI * 2) / arms) + t * 5.2;
      const rad = 14 + t * 118;
      dots.push({ x: 320 + Math.cos(ang) * rad, y: 180 + Math.sin(ang) * rad * 0.72, r: 2.4 + (1 - t) * 3.2 });
    }
  }
  return dots;
};

const Hospital = ({ x, h }: { x: number; h: number }) => (
  <g>
    <rect x={x} y={440 - h} width={46} height={h} fill={INK} />
    {Array.from({ length: Math.floor(h / 24) }).map((_, r) =>
      [0, 1].map((c) => <rect key={`${r}-${c}`} x={x + 8 + c * 20} y={440 - h + 8 + r * 22} width={10} height={12} fill={PAPER} />),
    )}
    <rect x={x + 18} y={440 - h - 14} width={10} height={14} fill={INK} />
    <rect x={x + 14} y={440 - h - 10} width={18} height={6} fill={INK} />
  </g>
);

const PageStorm = () => {
  const dots = useMemo(spiralDots, []);
  return (
    <svg viewBox="0 0 640 470" role="img" aria-label="Page 1: a storm of health data gathers over a city of clinics" className="h-full w-full">
      <Defs />
      <rect width="640" height="470" fill={PAPER} />
      <Panel x={20} y={20} w={600} h={430} fill={INK}>
        <rect x={20} y={20} width={600} height={430} fill="url(#htLight)" opacity={0.22} />
        <g className="comic-spin" style={{ transformOrigin: "320px 180px" }}>
          {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={PAPER} />)}
        </g>
        {/* paper sheets caught in the storm */}
        {[[150, 120, -18], [470, 110, 22], [210, 250, 12], [430, 250, -14], [320, 70, 6]].map(([x, y, a], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
            <rect x={-16} y={-21} width={32} height={42} fill={PAPER} stroke={INK} strokeWidth={2} />
            {[-11, -4, 3, 10].map((ly) => <line key={ly} x1={-10} x2={10} y1={ly} y2={ly} stroke={INK} strokeWidth={2} />)}
          </g>
        ))}
        {/* lightning */}
        <path d="M356 150 L322 232 L344 232 L318 318 L384 214 L358 214 L392 150 Z" fill={PAPER} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* ground + clinics */}
        <rect x={20} y={440} width={600} height={10} fill={PAPER} />
        {[40, 110, 190, 270, 350, 430, 510, 565].map((x, i) => <Hospital key={x} x={x} h={[70, 110, 80, 130, 90, 120, 76, 100][i]} />)}
        <Sfx x={530} y={78} text="CRACK!" rot={9} size={46} />
      </Panel>
      <Caption x={30} y={30} w={330} lines={["ACROSS THE COUNTRY, EVERY CLINIC AND LAB", "QUIETLY RECORDS THE SAME STORM…"]} />
      <Bubble cx={512} cy={300} rx={104} ry={44} tail={[470, 360]} lines={["ANOTHER FEVER CASE…", "AND ANOTHER. AND ANOTHER."]} />
    </svg>
  );
};

/* ───────── page 2: order from chaos ───────── */

const PageOrder = () => (
  <svg viewBox="0 0 640 470" role="img" aria-label="Page 2: scattered records are gathered into one uniform format" className="h-full w-full">
    <Defs />
    <rect width="640" height="470" fill={PAPER} />
    <Panel x={20} y={20} w={290} h={310} fill={PAPER}>
      <rect x={20} y={20} width={290} height={310} fill="url(#ht)" opacity={0.1} />
      {[[70, 90, -24, 1], [150, 70, 18, 2], [235, 105, -10, 3], [95, 190, 30, 2], [200, 205, -28, 1], [260, 280, 14, 3], [60, 275, -8, 2], [145, 285, 24, 1], [120, 135, 8, 3]].map(([x, y, a, k], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <rect x={-22} y={-28} width={44} height={56} fill={PAPER} stroke={INK} strokeWidth={2.5} />
          {Array.from({ length: 4 }).map((_, l) => <line key={l} x1={-14} x2={l === 3 ? 0 : 14} y1={-16 + l * 10} y2={-16 + l * 10} stroke={INK} strokeWidth={k === 2 ? 2.5 : 1.8} strokeDasharray={k === 3 ? "3 3" : undefined} />)}
        </g>
      ))}
    </Panel>
    <Panel x={330} y={20} w={290} h={310} fill={INK}>
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 3 }).map((_, c) => (
          <g key={`${r}-${c}`} transform={`translate(${350 + c * 90} ${38 + r * 72})`}>
            <rect width={74} height={58} fill={PAPER} />
            <rect x={8} y={10} width={30} height={5} fill={INK} />
            <rect x={8} y={22} width={58} height={4} fill={INK} opacity={0.55} />
            <rect x={8} y={32} width={46} height={4} fill={INK} opacity={0.55} />
            <path d={`M${50} ${46} l5 5 l10 -12`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )),
      )}
    </Panel>
    <path d="M286 175 L346 175 L346 150 L396 190 L346 230 L346 205 L286 205 Z" fill={PAPER} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Sfx x={318} y={96} text="WHOOSH!" rot={-10} size={40} />
    <Caption x={32} y={32} w={196} lines={["HOSPITALS. LABS. CLINICS.", "EVERY ONE WRITES IT", "DIFFERENTLY…"]} />
    <Panel x={20} y={346} w={600} h={104} fill={PAPER}>
      <rect x={20} y={346} width={600} height={104} fill="url(#ht)" opacity={0.07} />
    </Panel>
    <Caption x={34} y={358} w={238} lines={["TEMPEST GATHERS EVERY RECORD", "INTO ONE UNIFORM FORMAT."]} />
    <Bubble cx={440} cy={398} rx={150} ry={34} tail={[330, 440]} lines={["ONE FORMAT. ONE LANGUAGE.", "ONE CLEAR PICTURE."]} size={15} />
  </svg>
);

/* ───────── page 3: analyse ───────── */

const PageAnalyse = () => {
  const pts = [[40, 300], [90, 290], [140, 296], [190, 270], [240, 150], [290, 235], [340, 250], [380, 262]];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x + 20},${y + 30}`).join(" ");
  return (
    <svg viewBox="0 0 640 470" role="img" aria-label="Page 3: models analyse the data and flag a growing outbreak" className="h-full w-full">
      <Defs />
      <rect width="640" height="470" fill={PAPER} />
      <Panel x={20} y={20} w={390} h={430} fill={PAPER}>
        <rect x={20} y={20} width={390} height={430} fill="url(#ht)" opacity={0.08} />
        {[100, 160, 220, 280, 340, 400].map((y) => <line key={y} x1={50} x2={395} y1={y} y2={y} stroke={INK} strokeWidth={1} strokeDasharray="4 5" opacity={0.45} />)}
        <line x1={50} y1={70} x2={50} y2={410} stroke={INK} strokeWidth={3} />
        <line x1={50} y1={410} x2={395} y2={410} stroke={INK} strokeWidth={3} />
        <path d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={`${d} L400,410 L60,410 Z`} fill="url(#hatch)" opacity={0.18} />
        {pts.map(([x, y], i) => <circle key={i} cx={x + 20} cy={y + 30} r={i === 4 ? 7 : 4.5} fill={i === 4 ? INK : PAPER} stroke={INK} strokeWidth={2.5} />)}
        {/* alert on the spike */}
        <path d="M260 164 L276 192 L244 192 Z" fill={PAPER} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <text x={260} y={188} textAnchor="middle" fontFamily={FX} fontSize={16} fill={INK}>!</text>
        {/* magnifier */}
        <circle cx={262} cy={180} r={50} fill="none" stroke={INK} strokeWidth={7} />
        <line x1={298} y1={216} x2={346} y2={264} stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <Sfx x={120} y={140} text="PING!" rot={-12} size={44} />
      </Panel>
      <Caption x={30} y={32} w={290} lines={["THEN THE MODELS GET TO WORK:", "FORECASTS, HOTSPOTS, ANOMALIES."]} />

      <Panel x={426} y={20} w={194} h={200} fill={INK}>
        <rect x={426} y={20} width={194} height={200} fill="url(#htLight)" opacity={0.18} />
        <text x={523} y={118} textAnchor="middle" fontFamily={FX} fontSize={64} fill={PAPER} stroke={INK} strokeWidth={2}>1.33</text>
        <text x={523} y={148} textAnchor="middle" fontFamily={HAND} fontSize={15} fill={PAPER} letterSpacing={1}>RT · GROWING</text>
        <text x={523} y={48} textAnchor="middle" fontFamily={HAND} fontSize={12} fill={PAPER} letterSpacing={1.2}>EFFECTIVE REPRODUCTION</text>
      </Panel>
      <Panel x={426} y={236} w={194} h={214} fill={PAPER}>
        {Array.from({ length: 6 }).map((_, r) => Array.from({ length: 5 }).map((__, c) => {
          const hot = (r === 2 && c === 2) || (r === 2 && c === 3) || (r === 3 && c === 2);
          const warm = (r === 1 && c === 2) || (r === 3 && c === 3) || (r === 2 && c === 1);
          return <circle key={`${r}-${c}`} cx={452 + c * 36} cy={266 + r * 32} r={hot ? 12 : warm ? 8 : 4} fill={hot ? INK : warm ? MID : "none"} stroke={INK} strokeWidth={2} />;
        }))}
      </Panel>
      <Bubble cx={338} cy={398} rx={138} ry={40} tail={[420, 436]} lines={["DENGUE IS RISING IN MUMBAI.", "ACT NOW, NOT NEXT MONTH."]} size={14} />
    </svg>
  );
};

/* ───────── page 4: the invitation ───────── */

const PageFuture = () => (
  <svg viewBox="0 0 640 470" role="img" aria-label="Page 4: you're one step away from a next-generation health surveillance experience" className="h-full w-full">
    <Defs />
    <rect width="640" height="470" fill={PAPER} />
    <Panel x={20} y={20} w={600} h={430} fill={PAPER}>
      <rect x={20} y={20} width={600} height={430} fill="url(#ht)" opacity={0.1} />
      {/* calm after the storm: a steady pulse line */}
      <path d="M20 372 H190 L212 332 L238 408 L264 350 L284 372 H620" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* figure with stethoscope */}
      <circle cx={140} cy={226} r={38} fill={PAPER} stroke={INK} strokeWidth={5} />
      <path d="M96 218 Q140 170 184 218 Q150 200 96 218 Z" fill={INK} />
      <path d="M62 372 Q64 290 140 278 Q216 290 218 372 Z" fill={INK} />
      <path d="M118 282 Q112 336 140 344 Q168 336 162 282" fill="none" stroke={PAPER} strokeWidth={4} strokeLinecap="round" />
      <circle cx={140} cy={348} r={8} fill={PAPER} stroke={INK} strokeWidth={3} />
      {/* the storm, tamed into a tidy dashboard at the right */}
      <rect x={400} y={96} width={190} height={130} fill={PAPER} stroke={INK} strokeWidth={4} />
      <rect x={400} y={96} width={190} height={22} fill={INK} />
      {[0, 1, 2].map((i) => <circle key={i} cx={412 + i * 12} cy={107} r={3.5} fill={PAPER} />)}
      <polyline points="414,206 444,176 470,192 502,142 532,170 574,126" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {[[444, 176], [502, 142], [574, 126]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={5} fill={INK} />)}
      <rect x={414} y={130} width={44} height={8} fill={INK} opacity={0.5} />
      <Sfx x={500} y={276} text="CALM." rot={-7} size={38} />
    </Panel>
    <Caption x={30} y={32} w={300} lines={["TEMPEST TURNS THE STORM OF DATA", "INTO CARE THAT ARRIVES EARLY."]} />
    <Bubble cx={310} cy={176} rx={166} ry={64} tail={[190, 238]} size={16} lines={["YOU'RE JUST ONE STEP AWAY", "FROM A NEXT-GENERATION", "HEALTH SURVEILLANCE", "EXPERIENCE."]} />
    <g transform="translate(40 416)">
      <rect x={0} y={0} width={156} height={30} fill={INK} />
      <text x={78} y={22} textAnchor="middle" fontFamily={FX} fontSize={22} letterSpacing={2} fill={PAPER}>← SIGN IN</text>
    </g>
  </svg>
);

const PAGES: { title: string; node: ReactNode }[] = [
  { title: "The storm gathers", node: <PageStorm /> },
  { title: "Order from chaos", node: <PageOrder /> },
  { title: "Analyse", node: <PageAnalyse /> },
  { title: "One step away", node: <PageFuture /> },
];

/* ───────── the flipping book ───────── */

const ComicStory = () => {
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);

  const go = useCallback((next: number) => {
    setDir(next > page || (page === PAGES.length - 1 && next === 0) ? 1 : -1);
    setPage((next + PAGES.length) % PAGES.length);
  }, [page]);

  // Turns the page by itself every few seconds; a manual turn restarts the timer
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => go(page + 1), 7000);
    return () => clearTimeout(t);
  }, [page, reduce, go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(page + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(page - 1); }
  };

  return (
    <div
      className="mx-auto w-full cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#e8e2d8]/60"
      // never taller than the screen allows: heading and quote take ~280px
      style={{ maxWidth: "min(600px, calc((100vh - 280px) * 640 / 470))" }}
      role="button"
      tabIndex={0}
      onClick={() => go(page + 1)}
      onKeyDown={onKey}
      aria-roledescription="comic book"
      aria-label={`Tempest comic, page ${page + 1} of ${PAGES.length}: ${PAGES[page].title}. Click or press the arrow keys to turn the page.`}
    >
      <div className="relative aspect-[640/470] w-full overflow-hidden rounded-[3px] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.8)]" style={{ perspective: 1400, background: PAPER }}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={page}
            className="absolute inset-0"
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: dir * 55, x: dir * 30, transformOrigin: dir > 0 ? "left center" : "right center" }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: dir * -55, x: dir * -30, transformOrigin: dir > 0 ? "right center" : "left center" }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {PAGES[page].node}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

export default ComicStory;
