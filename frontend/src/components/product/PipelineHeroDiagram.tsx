import "./PipelineHeroDiagram.css";

type Stage = {
  id: string;
  label: string;
  y: number;
};

const STAGES: Stage[] = [
  { id: "commit", label: "Commit", y: 92 },
  { id: "prove", label: "Prove", y: 192 },
  { id: "verify", label: "Verify", y: 292 },
  { id: "apply", label: "Apply", y: 392 },
];

/** Isometric zkML pipeline diagram for the overview hero (Dispatch-style). */
export function PipelineHeroDiagram() {
  const cx = 168;
  const planeW = 88;
  const planeH = 44;

  const plane = (y: number) =>
    `M ${cx} ${y - planeH} L ${cx + planeW} ${y} L ${cx} ${y + planeH} L ${cx - planeW} ${y} Z`;

  return (
    <figure className="pipeline-diagram" aria-label="Zyocra pipeline: commit, prove, verify, apply">
      <svg
        className="pipeline-diagram__svg"
        viewBox="0 0 420 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Zyocra zkML pipeline</title>
        <defs>
          <pattern id="pipeline-dot-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.65" fill="rgba(232,227,213,0.14)" />
          </pattern>
          <linearGradient id="pipeline-spine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(235,165,14,0.15)" />
            <stop offset="50%" stopColor="rgba(232,227,213,0.55)" />
            <stop offset="100%" stopColor="rgba(235,165,14,0.2)" />
          </linearGradient>
          <radialGradient id="pipeline-sphere" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(232,227,213,0.95)" />
            <stop offset="100%" stopColor="rgba(232,227,213,0.18)" />
          </radialGradient>
          <filter id="pipeline-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="420" height="480" fill="url(#pipeline-dot-grid)" />

        {/* Spine */}
        <line
          x1={cx}
          y1="48"
          x2={cx}
          y2="432"
          stroke="url(#pipeline-spine)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <circle cx={cx} cy="48" r="3" fill="var(--color-canvas)" stroke="rgba(232,227,213,0.5)" />
        <circle cx={cx} cy="432" r="3" fill="var(--color-canvas)" stroke="rgba(232,227,213,0.5)" />

        {STAGES.map((stage) => (
          <g key={stage.id} className="pipeline-diagram__stage">
            <path d={plane(stage.y)} className="pipeline-diagram__plane" />
            <path
              d={plane(stage.y)}
              className="pipeline-diagram__plane-edge"
              transform={`translate(0, ${planeH * 0.35})`}
              opacity="0.35"
            />
          </g>
        ))}

        {/* Commit — pyramid (epoch commitments) */}
        <g className="pipeline-diagram__shape">
          <path
            d={`M ${cx} ${STAGES[0].y - 34} L ${cx + 22} ${STAGES[0].y + 4} L ${cx} ${STAGES[0].y + 18} L ${cx - 22} ${STAGES[0].y + 4} Z`}
            stroke="rgba(232,227,213,0.75)"
            strokeWidth="1"
            fill="rgba(232,227,213,0.06)"
          />
          <path
            d={`M ${cx} ${STAGES[0].y - 34} L ${cx} ${STAGES[0].y + 18}`}
            stroke="rgba(232,227,213,0.35)"
            strokeWidth="1"
          />
          <path
            d={`M ${cx - 22} ${STAGES[0].y + 4} L ${cx + 22} ${STAGES[0].y + 4}`}
            stroke="rgba(232,227,213,0.35)"
            strokeWidth="1"
          />
        </g>

        {/* Prove — sphere (EZKL witness) */}
        <g className="pipeline-diagram__shape">
          <ellipse
            cx={cx}
            cy={STAGES[1].y - 6}
            rx="26"
            ry="10"
            stroke="rgba(232,227,213,0.25)"
            strokeWidth="1"
          />
          <circle
            cx={cx}
            cy={STAGES[1].y - 10}
            r="22"
            fill="url(#pipeline-sphere)"
            stroke="rgba(232,227,213,0.7)"
            strokeWidth="1"
          />
          <path
            d={`M ${cx - 22} ${STAGES[1].y - 10} A 22 22 0 0 0 ${cx + 22} ${STAGES[1].y - 10}`}
            stroke="rgba(232,227,213,0.45)"
            strokeWidth="1"
            fill="none"
          />
        </g>

        {/* Verify — hex ring (Groth16 / Halo2) */}
        <g className="pipeline-diagram__shape" filter="url(#pipeline-glow)">
          <path
            d={`M ${cx} ${STAGES[2].y - 24}
               L ${cx + 20} ${STAGES[2].y - 12}
               L ${cx + 20} ${STAGES[2].y + 8}
               L ${cx} ${STAGES[2].y + 20}
               L ${cx - 20} ${STAGES[2].y + 8}
               L ${cx - 20} ${STAGES[2].y - 12} Z`}
            stroke="var(--color-accent)"
            strokeWidth="1.25"
            fill="rgba(235,165,14,0.08)"
          />
          <circle
            cx={cx}
            cy={STAGES[2].y - 2}
            r="7"
            stroke="rgba(232,227,213,0.5)"
            strokeWidth="1"
            fill="var(--color-canvas-elevated)"
          />
        </g>

        {/* Apply — stacked platform (RiskConsumer) */}
        <g className="pipeline-diagram__shape">
          <path
            d={`M ${cx} ${STAGES[3].y + 6} L ${cx + 34} ${STAGES[3].y + 22} L ${cx} ${STAGES[3].y + 38} L ${cx - 34} ${STAGES[3].y + 22} Z`}
            stroke="rgba(232,227,213,0.55)"
            strokeWidth="1"
            fill="rgba(232,227,213,0.04)"
          />
          <path
            d={`M ${cx} ${STAGES[3].y - 8} L ${cx + 28} ${STAGES[3].y + 6} L ${cx} ${STAGES[3].y + 20} L ${cx - 28} ${STAGES[3].y + 6} Z`}
            stroke="rgba(232,227,213,0.75)"
            strokeWidth="1"
            fill="rgba(232,227,213,0.1)"
          />
          <path
            d={`M ${cx} ${STAGES[3].y - 22} L ${cx + 20} ${STAGES[3].y - 10} L ${cx} ${STAGES[3].y + 2} L ${cx - 20} ${STAGES[3].y - 10} Z`}
            stroke="rgba(232,227,213,0.85)"
            strokeWidth="1"
            fill="rgba(232,227,213,0.14)"
          />
        </g>

        {/* Stage labels */}
        {STAGES.map((stage) => (
          <g key={`${stage.id}-label`} className="pipeline-diagram__label">
            <line
              x1={cx + planeW + 8}
              y1={stage.y}
              x2="318"
              y2={stage.y}
              stroke="rgba(232,227,213,0.28)"
              strokeWidth="1"
            />
            <circle cx={cx + planeW + 8} cy={stage.y} r="2.5" fill="var(--color-canvas)" stroke="rgba(232,227,213,0.5)" />
            <text x="326" y={stage.y + 4} className="pipeline-diagram__label-text">
              {stage.label}
            </text>
          </g>
        ))}

        {/* Corner brackets */}
        <path d="M 12 12 H 28 M 12 12 V 28" stroke="rgba(232,227,213,0.22)" strokeWidth="1" />
        <path d="M 408 12 H 392 M 408 12 V 28" stroke="rgba(232,227,213,0.22)" strokeWidth="1" />
        <path d="M 12 468 H 28 M 12 468 V 452" stroke="rgba(232,227,213,0.22)" strokeWidth="1" />
        <path d="M 408 468 H 392 M 408 468 V 452" stroke="rgba(232,227,213,0.22)" strokeWidth="1" />
      </svg>
    </figure>
  );
}
