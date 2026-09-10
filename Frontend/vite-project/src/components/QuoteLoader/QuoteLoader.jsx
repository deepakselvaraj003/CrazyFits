
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VB_W = 600;
const VB_H = 260;
const GROUND_Y = 196;
const HOME_X = 68;
const DOOR_X = 428;
const SCANNER_X = 486;

const PHASES = [
  { key: 'walk-to-door', duration: 2000, x: DOOR_X, facing: 1, walking: true, box: true },
  { key: 'door-open', duration: 500, x: DOOR_X, facing: 1, walking: false, box: true, doorOpen: true },
  { key: 'enter', duration: 800, x: SCANNER_X, facing: 1, walking: true, box: true, doorOpen: true },
  { key: 'scanning', duration: 1500, x: SCANNER_X, facing: 1, walking: false, box: true, doorOpen: true, scanning: true },
  { key: 'deposit', duration: 650, x: SCANNER_X, facing: 1, walking: false, box: false, doorOpen: true, depositing: true },
  { key: 'exit', duration: 800, x: DOOR_X, facing: -1, walking: true, box: false, doorOpen: true },
  { key: 'door-close', duration: 500, x: DOOR_X, facing: -1, walking: false, box: false, doorOpen: false },
  { key: 'walk-back', duration: 2000, x: HOME_X, facing: -1, walking: true, box: false },
  { key: 'pickup', duration: 750, x: HOME_X, facing: 1, walking: false, box: true, pickup: true },
];

const DEFAULT_MESSAGES = [
  'Preparing your quotation...',
  'Packing your custom T-shirt...',
  'Sending your request to our production team...',
  'Processing your design...',
  'Almost ready...',
];


function usePhaseTimeline(active, reducedMotion) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active || reducedMotion) return undefined;

    const step = (idx) => {
      const phase = PHASES[idx];
      timerRef.current = setTimeout(() => {
        const next = (idx + 1) % PHASES.length;
        if (next === 0) setLoopCount((c) => c + 1);
        setPhaseIdx(next);
        step(next);
      }, phase.duration);
    };

    step(phaseIdx);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion]);

  return { phase: PHASES[phaseIdx], loopCount };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

function Courier({ phase }) {
  const walking = !!phase.walking;
  const legTransition = walking
    ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
    : { duration: 0.5, ease: 'easeOut' };
  const bobTransition = walking
    ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
    : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' };

  return (
    <motion.g
      className="trl-courier"
      animate={{ x: phase.x, scaleX: phase.facing }}
      transition={{
        x: { duration: phase.duration / 1000, ease: 'easeInOut' },
        scaleX: { duration: 0.32, ease: 'easeInOut' },
      }}
      style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
    >
      <g transform={`translate(0, ${150})`}>
        {/* ground shadow */}
        <motion.ellipse
          cx="0"
          cy="90"
          ry="4.2"
          className="trl-shadow"
          initial={{ rx: 17 }}
          animate={{ rx: walking ? [15, 18, 15] : 16, opacity: walking ? [0.22, 0.32, 0.22] : 0.26 }}
          transition={bobTransition}
        />

        {/* legs (pivot at hip) */}
        <motion.rect
          x="-7" y="47" width="6" height="30" rx="3"
          className="trl-leg"
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
          animate={{ rotate: walking ? [-24, 22, -24] : 0 }}
          transition={legTransition}
        />
        <motion.rect
          x="1" y="47" width="6" height="30" rx="3"
          className="trl-leg"
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
          animate={{ rotate: walking ? [22, -24, 22] : 0 }}
          transition={legTransition}
        />

        {/* bobbing upper body */}
        <motion.g
          animate={{ y: walking ? [0, -3, 0] : [0, -1.4, 0] }}
          transition={bobTransition}
        >
          {/* free swinging arm */}
          <motion.rect
            x="-13.5" y="24" width="5" height="21" rx="2.5"
            className="trl-arm"
            style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
            animate={{ rotate: walking ? [26, -22, 26] : -6 }}
            transition={legTransition}
          />

          {/* torso (uniform) */}
          <rect x="-9" y="21" width="18" height="26" rx="7" className="trl-torso" />
          <rect x="-9" y="43" width="18" height="3.2" className="trl-belt" />

          {/* supporting arm — bent, holding the package */}
          <path
            d="M 8 24 C 14 22, 15 10, 10.5 -1 C 9.6 -3, 7 -3.4, 6.2 -1.4 C 9.6 8, 8.6 18, 4.5 23 Z"
            className="trl-arm"
          />

          {/* head */}
          <circle cx="0" cy="12" r="9.2" className="trl-skin" />
          <circle cx="-3.1" cy="11.4" r="1.05" className="trl-eye" />
          <circle cx="3.1" cy="11.4" r="1.05" className="trl-eye" />
          <path d="M -3.4 15.4 Q 0 17.6 3.4 15.4" className="trl-smile" />

          {/* cap (uniform) */}
          <path d="M -9.6 8.4 A 9.6 9.6 0 0 1 9.6 8.4 L 9.6 6.4 Q 0 0.6 -9.6 6.4 Z" className="trl-cap" />
          <rect x="1.5" y="6" width="9.5" height="3.2" rx="1.4" className="trl-cap-brim" />

          {/* package on head, riding with the same bob */}
          <AnimatePresence>
            {phase.box && (
              <motion.g
                key="carrying"
                initial={phase.pickup ? { opacity: 0, y: 46, scale: 0.55 } : false}
                animate={{ opacity: 1, y: -19, scale: 1 }}
                exit={{ x: 34, y: 18, scale: 0.15, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <g transform="translate(0, -19)">
                  <rect x="-13" y="-8" width="26" height="16" rx="3" className="trl-box" />
                  <line x1="-13" y1="0" x2="13" y2="0" className="trl-box-ribbon" />
                  <line x1="0" y1="-8" x2="0" y2="8" className="trl-box-ribbon" />
                  <motion.g
                    animate={{ rotate: [-6, 6, -6] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}
                  >
                    <line x1="10" y1="-8" x2="15" y2="-13" className="trl-tag-string" />
                    <rect x="13.5" y="-16.5" width="7" height="5" rx="1" className="trl-tag" />
                  </motion.g>
                </g>
              </motion.g>
            )}
          </AnimatePresence>
        </motion.g>
      </g>
    </motion.g>
  );
}

function Warehouse({ phase, loopCount }) {
  const open = !!phase.doorOpen;
  const scanning = !!phase.scanning;
  const depositing = !!phase.depositing;
  const litShelf = loopCount % 4;

  return (
    <g>
      {/* building shell */}
      <rect x="398" y="88" width="182" height="108" rx="10" className="trl-warehouse-wall" />
      <path d="M 392 90 L 489 54 L 586 90 Z" className="trl-warehouse-roof" />
      <rect x="416" y="66" width="146" height="16" rx="4" className="trl-warehouse-sign" />
      <text x="489" y="78" textAnchor="middle" className="trl-warehouse-sign-text">
        THREAD &amp; CO. WAREHOUSE
      </text>

      {/* ambient window glow */}
      <motion.rect
        x="530" y="104" width="34" height="24" rx="4"
        className="trl-window"
        animate={{ opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* interior (revealed behind the door opening) */}
      <clipPath id="trl-door-clip">
        <rect x="452" y="128" width="68" height="68" rx="4" />
      </clipPath>
      <g clipPath="url(#trl-door-clip)">
        <rect x="452" y="128" width="68" height="68" className="trl-interior" />

        {/* scanner unit on the back wall */}
        <rect x="478" y="134" width="16" height="8" rx="2" className="trl-scanner-unit" />
        <circle cx="486" cy="138" r="2" className="trl-scanner-lens" />

        {/* inventory shelf, 2x2 folded-shirt icons */}
        {[0, 1, 2, 3].map((i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const lit = depositing && i === litShelf;
          return (
            <motion.g
              key={i}
              transform={`translate(${462 + col * 26}, ${168 + row * 16})`}
              animate={{ scale: lit ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 0.6 }}
            >
              <rect width="18" height="12" rx="2" className={lit ? 'trl-shelf-item trl-shelf-item-lit' : 'trl-shelf-item'} />
              <line x1="6" y1="0" x2="6" y2="12" className="trl-shelf-fold" />
            </motion.g>
          );
        })}

        {/* scanner beam sweep */}
        <AnimatePresence>
          {scanning && (
            <motion.rect
              key="beam"
              x="482" y="140" width="8" height="3"
              className="trl-scan-beam"
              initial={{ y: 140, opacity: 0 }}
              animate={{ y: [140, 178, 140], opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </g>

      {/* glow ring around package while scanning */}
      <AnimatePresence>
        {scanning && (
          <motion.circle
            key="glow"
            cx={SCANNER_X} cy="168" r="6"
            className="trl-scan-glow"
            initial={{ opacity: 0, r: 4 }}
            animate={{ opacity: [0.15, 0.55, 0.15], r: [10, 16, 10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* sliding door panels (drawn above interior so they cover it when closed) */}
      <rect x="452" y="128" width="68" height="4" className="trl-door-track" />
      <motion.rect
        y="128" width="34" height="68" rx="2"
        className="trl-door-panel"
        animate={{ x: open ? 412 : 452 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
      <motion.rect
        y="128" width="34" height="68" rx="2"
        className="trl-door-panel"
        animate={{ x: open ? 528 : 486 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
    </g>
  );
}

function Environment() {
  return (
    <g>
      <g className="trl-cloud trl-cloud-a">
        <ellipse cx="0" cy="0" rx="20" ry="8" />
        <ellipse cx="14" cy="-4" rx="14" ry="7" />
        <ellipse cx="-14" cy="-2" rx="12" ry="6" />
      </g>
      <g className="trl-cloud trl-cloud-b">
        <ellipse cx="0" cy="0" rx="16" ry="6.5" />
        <ellipse cx="11" cy="-3" rx="10" ry="5.5" />
      </g>
      <g className="trl-cloud trl-cloud-c">
        <ellipse cx="0" cy="0" rx="13" ry="5.5" />
        <ellipse cx="9" cy="-2.5" rx="9" ry="4.5" />
      </g>

      <line x1="20" y1={GROUND_Y} x2="392" y2={GROUND_Y} className="trl-ground-line" />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} className={`trl-particle trl-particle-${i}`} r={1.4 + (i % 3) * 0.4} />
      ))}
    </g>
  );
}

function StatusTicker({ messages, interval, active }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % messages.length);
    }, interval);
    return () => clearInterval(id);
  }, [active, interval, messages.length]);

  return (
    <div className="trl-status">
      <div className="trl-status-text-wrap">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            className="trl-status-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {messages[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="trl-stitches" aria-hidden="true">
        {messages.map((_, i) => (
          <span key={i} className={`trl-stitch ${i === idx ? 'trl-stitch-active' : i < idx ? 'trl-stitch-done' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export function ThreadReelLoader({
  theme = 'light',
  isLoading = true,
  messages = DEFAULT_MESSAGES,
  messageInterval = 2200,
  className = '',
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { phase, loopCount } = usePhaseTimeline(isLoading, reducedMotion);
  const resolvedMessages = useMemo(() => (messages && messages.length ? messages : DEFAULT_MESSAGES), [messages]);

  if (!isLoading) return null;

  return (
    <div className={`trl-root ${className}`} data-theme={theme} role="status" aria-live="polite">
      <style>{STYLES}</style>
      <div className="trl-card">
        <div className="trl-scene-wrap">
          <svg
            className="trl-scene"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMax meet"
            role="img"
            aria-label="Illustration of a courier delivering a package to a warehouse"
          >
            <defs>
              <linearGradient id="trl-sky-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--trl-sky-top)" />
                <stop offset="100%" stopColor="var(--trl-sky-bottom)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#trl-sky-light)" rx="18" />

            {reducedMotion ? (
              <>
                <Environment />
                <Warehouse phase={{ doorOpen: true }} loopCount={0} />
                <Courier phase={{ x: HOME_X + 120, facing: 1, walking: false, box: true }} />
              </>
            ) : (
              <>
                <Environment />
                <Warehouse phase={phase} loopCount={loopCount} />
                <Courier phase={phase} />
              </>
            )}
          </svg>
        </div>

        <StatusTicker messages={resolvedMessages} interval={messageInterval} active={!reducedMotion || true} />
      </div>
    </div>
  );
}

/* ============================================================== *
 *  Styles — theme tokens, font import, decorative CSS animation
 * ============================================================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

.trl-root {
  --trl-ink-900: #14182B;
  --trl-ink-700: #2B3158;
  --trl-coral: #FF5D5D;
  --trl-coral-soft: #FFD9CF;
  --trl-gold: #FFB648;
  --trl-mint: #2FE0A6;
  --trl-slate: #6B7280;

  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.trl-root[data-theme='light'] {
  --trl-card-bg: #FFFFFF;
  --trl-card-border: #ECEAF5;
  --trl-card-shadow: 0 20px 50px -18px rgba(20, 24, 43, 0.28), 0 2px 8px rgba(20, 24, 43, 0.06);
  --trl-sky-top: #EAF0FB;
  --trl-sky-bottom: #F7F5EF;
  --trl-ground: #E1DED2;
  --trl-cloud: rgba(43, 49, 88, 0.10);
  --trl-particle: rgba(255, 93, 93, 0.35);
  --trl-warehouse-wall: #EDEFF6;
  --trl-warehouse-wall-stroke: #D9DCEA;
  --trl-warehouse-roof: var(--trl-ink-700);
  --trl-warehouse-sign: var(--trl-ink-900);
  --trl-warehouse-sign-text: #F7F5EF;
  --trl-interior: #1E2340;
  --trl-window: #FFE3A6;
  --trl-door: #3C4373;
  --trl-shelf: #545C93;
  --trl-shelf-lit: var(--trl-gold);
  --trl-skin: #E8B98A;
  --trl-text: var(--trl-ink-900);
  --trl-text-soft: var(--trl-slate);
}

.trl-root[data-theme='dark'] {
  --trl-card-bg: #171B2E;
  --trl-card-border: #262C48;
  --trl-card-shadow: 0 24px 60px -18px rgba(0, 0, 0, 0.55), 0 2px 10px rgba(0, 0, 0, 0.3);
  --trl-sky-top: #12142590;
  --trl-sky-bottom: #1B2036;
  --trl-ground: #2A3050;
  --trl-cloud: rgba(237, 239, 247, 0.08);
  --trl-particle: rgba(255, 182, 72, 0.4);
  --trl-warehouse-wall: #232A4C;
  --trl-warehouse-wall-stroke: #333B66;
  --trl-warehouse-roof: #0F1226;
  --trl-warehouse-sign: #0F1226;
  --trl-warehouse-sign-text: #EDEFF7;
  --trl-interior: #0D1022;
  --trl-window: #FFCF7A;
  --trl-door: #4A5390;
  --trl-shelf: #454E82;
  --trl-shelf-lit: var(--trl-gold);
  --trl-skin: #E8B98A;
  --trl-text: #EDEFF7;
  --trl-text-soft: #9AA1C0;
}

.trl-card {
  width: 100%;
  max-width: 400px;
  padding: clamp(16px, 4vw, 24px);
  border-radius: 22px;
  background: var(--trl-card-bg);
  border: 1px solid var(--trl-card-border);
  box-shadow: var(--trl-card-shadow);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
}

.trl-scene-wrap {
  width: 100%;
  aspect-ratio: 600 / 260;
  overflow: hidden;
  border-radius: 16px;
}

.trl-scene { width: 100%; height: 100%; display: block; }

/* ---- courier ---- */
.trl-shadow { fill: var(--trl-ink-900); }
.trl-leg { fill: var(--trl-ink-700); }
.trl-arm { fill: var(--trl-skin); }
.trl-torso { fill: var(--trl-coral); }
.trl-belt { fill: var(--trl-ink-700); }
.trl-skin { fill: var(--trl-skin); }
.trl-eye { fill: var(--trl-ink-900); }
.trl-smile { fill: none; stroke: var(--trl-ink-900); stroke-width: 1; stroke-linecap: round; }
.trl-cap { fill: var(--trl-ink-700); }
.trl-cap-brim { fill: var(--trl-coral); }
.trl-box { fill: #F3E4C7; stroke: #D8C39C; stroke-width: 0.6; }
.trl-box-ribbon { stroke: var(--trl-coral); stroke-width: 2; }
.trl-tag { fill: var(--trl-gold); }
.trl-tag-string { stroke: var(--trl-slate); stroke-width: 0.6; }

/* ---- warehouse ---- */
.trl-warehouse-wall { fill: var(--trl-warehouse-wall); stroke: var(--trl-warehouse-wall-stroke); stroke-width: 1; }
.trl-warehouse-roof { fill: var(--trl-warehouse-roof); }
.trl-warehouse-sign { fill: var(--trl-warehouse-sign); }
.trl-warehouse-sign-text {
  fill: var(--trl-warehouse-sign-text);
  font-family: 'Space Mono', monospace;
  font-size: 6.4px;
  letter-spacing: 0.5px;
}
.trl-window { fill: var(--trl-window); filter: blur(0.3px); }
.trl-interior { fill: var(--trl-interior); }
.trl-door-track { fill: var(--trl-warehouse-wall-stroke); }
.trl-door-panel { fill: var(--trl-door); }
.trl-scanner-unit { fill: var(--trl-ink-900); }
.trl-scanner-lens { fill: var(--trl-mint); }
.trl-scan-beam { fill: var(--trl-mint); filter: drop-shadow(0 0 3px var(--trl-mint)); }
.trl-scan-glow { fill: var(--trl-mint); opacity: 0.3; filter: blur(2px); }
.trl-shelf-item { fill: var(--trl-shelf); }
.trl-shelf-item-lit { fill: var(--trl-shelf-lit); }
.trl-shelf-fold { stroke: rgba(0,0,0,0.18); stroke-width: 0.6; }

/* ---- environment ---- */
.trl-ground-line { stroke: var(--trl-ground); stroke-width: 2; stroke-linecap: round; }

.trl-cloud { fill: var(--trl-cloud); }
.trl-cloud-a { transform: translate(90px, 44px); animation: trl-drift-a 26s linear infinite; }
.trl-cloud-b { transform: translate(260px, 30px); animation: trl-drift-b 34s linear infinite; }
.trl-cloud-c { transform: translate(180px, 60px); animation: trl-drift-c 20s linear infinite; }

@keyframes trl-drift-a { 0% { transform: translate(90px, 44px); } 50% { transform: translate(130px, 44px); } 100% { transform: translate(90px, 44px); } }
@keyframes trl-drift-b { 0% { transform: translate(260px, 30px); } 50% { transform: translate(210px, 30px); } 100% { transform: translate(260px, 30px); } }
@keyframes trl-drift-c { 0% { transform: translate(180px, 60px); } 50% { transform: translate(225px, 60px); } 100% { transform: translate(180px, 60px); } }

.trl-particle { fill: var(--trl-particle); opacity: 0; }
.trl-particle-0 { cx: 60px; cy: 170px; animation: trl-float 5.5s ease-in-out infinite; animation-delay: 0s; }
.trl-particle-1 { cx: 140px; cy: 150px; animation: trl-float 6.2s ease-in-out infinite; animation-delay: 0.8s; }
.trl-particle-2 { cx: 230px; cy: 165px; animation: trl-float 5.8s ease-in-out infinite; animation-delay: 1.6s; }
.trl-particle-3 { cx: 320px; cy: 140px; animation: trl-float 6.6s ease-in-out infinite; animation-delay: 0.4s; }
.trl-particle-4 { cx: 20px; cy: 100px; animation: trl-float 7s ease-in-out infinite; animation-delay: 2.2s; }
.trl-particle-5 { cx: 370px; cy: 110px; animation: trl-float 6s ease-in-out infinite; animation-delay: 1.1s; }

@keyframes trl-float {
  0% { opacity: 0; transform: translateY(0); }
  15% { opacity: 0.55; }
  85% { opacity: 0.3; }
  100% { opacity: 0; transform: translateY(-26px); }
}

/* ---- status ticker ---- */
.trl-status { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.trl-status-text-wrap { min-height: 22px; display: flex; align-items: center; justify-content: center; }
.trl-status-text {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: clamp(14px, 3.6vw, 16px);
  color: var(--trl-text);
  letter-spacing: 0.1px;
}

.trl-stitches { display: flex; gap: 6px; }
.trl-stitch {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background: var(--trl-card-border);
  transition: background 0.3s ease, transform 0.3s ease;
}
.trl-stitch-done { background: var(--trl-coral-soft); }
.trl-stitch-active { background: var(--trl-coral); transform: scaleX(1.1); }

@media (max-width: 380px) {
  .trl-card { max-width: 92vw; padding: 14px; gap: 10px; border-radius: 18px; }
  .trl-stitch { width: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .trl-cloud, .trl-particle { animation: none !important; opacity: 0.4; }
}
`;

export default ThreadReelLoader;
