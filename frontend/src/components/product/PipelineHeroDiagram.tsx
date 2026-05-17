import "./PipelineHeroDiagram.css";

const STROKE = "rgba(232, 227, 213, 0.36)";
const STROKE_SOFT = "rgba(232, 227, 213, 0.22)";
const FILL_SOFT = "rgba(232, 227, 213, 0.035)";

type Stage = {
  id: string;
  label: string;
  y: number;
};

const STAGES: Stage[] = [
  { id: "commit", label: "Commit", y: 100 },
  { id: "prove", label: "Prove", y: 210 },
  { id: "verify", label: "Verify", y: 320 },
  { id: "apply", label: "Apply", y: 430 },
];

type Props = {
  activeStage?: string;
};

/** Isometric zkML pipeline diagram — muted wireframe aligned with Dispatch reference. */
export function PipelineHeroDiagram({ activeStage = "prove" }: Props) {
  const cx = 178;
  const planeW = 92;
  const planeH = 46;

  const plane = (y: number) =>
    `M ${cx} ${y - planeH} L ${cx + planeW} ${y} L ${cx} ${y + planeH} L ${cx - planeW} ${y} Z`;

  return (
    <figure className="pipeline-diagram" aria-label="Zyocra pipeline diagram">
      <svg
        className="pipeline-diagram__svg"
        viewBox="0 0 440 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Zyocra zkML pipeline</title>
        <defs>
          <pattern id="pipeline-dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.55" fill="rgba(232,227,213,0.07)" />
          </pattern>
          <radialGradient id="pipeline-vignette" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(31,31,31,0)" />
            <stop offset="100%" stopColor="rgba(17,17,17,0.55)" />
          </radialGradient>
        </defs>

        <rect width="440" height="520" fill="url(#pipeline-dot-grid)" />
        <rect width="440" height="520" fill="url(#pipeline-vignette)" />

        {/* Spine */}
        <line x1={cx} y1="56" x2={cx} y2="464" stroke={STROKE} strokeWidth="1" />
        <circle cx={cx} cy="56" r="2.5" fill="#1f1f1f" stroke={STROKE_SOFT} />
        <circle cx={cx} cy="464" r="2.5" fill="#1f1f1f" stroke={STROKE_SOFT} />

        {STAGES.map((stage) => {
          const active = stage.id === activeStage;
          return (
            <g key={stage.id} className={`pipeline-diagram__stage${active ? " is-active" : ""}`}>
              <path
                d={plane(stage.y)}
                className="pipeline-diagram__plane"
                stroke={active ? "rgba(232,227,213,0.42)" : STROKE_SOFT}
                fill={active ? "rgba(232,227,213,0.06)" : FILL_SOFT}
              />
            </g>
          );
        })}

        {/* Commit — wireframe pyramid */}
        <g className="pipeline-diagram__shape" opacity={activeStage === "commit" ? 1 : 0.72}>
          <path
            d={`M ${cx} ${STAGES[0].y - 36} L ${cx + 24} ${STAGES[0].y + 2} L ${cx} ${STAGES[0].y + 20} L ${cx - 24} ${STAGES[0].y + 2} Z`}
            stroke={STROKE}
            fill={FILL_SOFT}
          />
          <path d={`M ${cx} ${STAGES[0].y - 36} L ${cx} ${STAGES[0].y + 20}`} stroke={STROKE_SOFT} />
          <path d={`M ${cx - 24} ${STAGES[0].y + 2} L ${cx + 24} ${STAGES[0].y + 2}`} stroke={STROKE_SOFT} />
        </g>

        {/* Prove — wireframe hemisphere */}
        <g className="pipeline-diagram__shape" opacity={activeStage === "prove" ? 1 : 0.72}>
          <ellipse
            cx={cx}
            cy={STAGES[1].y + 2}
            rx="28"
            ry="11"
            stroke={STROKE_SOFT}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${cx - 28} ${STAGES[1].y + 2} A 28 28 0 0 1 ${cx + 28} ${STAGES[1].y + 2}`}
            stroke={STROKE}
            fill="none"
          />
          <path
            d={`M ${cx} ${STAGES[1].y - 26} L ${cx - 28} ${STAGES[1].y + 2}`}
            stroke={STROKE_SOFT}
          />
          <path
            d={`M ${cx} ${STAGES[1].y - 26} L ${cx + 28} ${STAGES[1].y + 2}`}
            stroke={STROKE_SOFT}
          />
        </g>

        {/* Verify — hollow hex nut (wireframe) */}
        <g className="pipeline-diagram__shape" opacity={activeStage === "verify" ? 1 : 0.72}>
          <path
            d={`M ${cx} ${STAGES[2].y - 26}
               L ${cx + 22} ${STAGES[2].y - 13}
               L ${cx + 22} ${STAGES[2].y + 9}
               L ${cx} ${STAGES[2].y + 22}
               L ${cx - 22} ${STAGES[2].y + 9}
               L ${cx - 22} ${STAGES[2].y - 13} Z`}
            stroke={STROKE}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${cx} ${STAGES[2].y - 12}
               L ${cx + 12} ${STAGES[2].y - 5}
               L ${cx + 12} ${STAGES[2].y + 7}
               L ${cx} ${STAGES[2].y + 14}
               L ${cx - 12} ${STAGES[2].y + 7}
               L ${cx - 12} ${STAGES[2].y - 5} Z`}
            stroke={STROKE_SOFT}
            fill="none"
          />
        </g>

        {/* Apply — iso platform stack */}
        <g className="pipeline-diagram__shape" opacity={activeStage === "apply" ? 1 : 0.72}>
          <path
            d={`M ${cx} ${STAGES[3].y + 8} L ${cx + 36} ${STAGES[3].y + 26} L ${cx} ${STAGES[3].y + 44} L ${cx - 36} ${STAGES[3].y + 26} Z`}
            stroke={STROKE_SOFT}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${cx} ${STAGES[3].y - 10} L ${cx + 30} ${STAGES[3].y + 8} L ${cx} ${STAGES[3].y + 26} L ${cx - 30} ${STAGES[3].y + 8} Z`}
            stroke={STROKE}
            fill={FILL_SOFT}
          />
        </g>

        {/* Labels */}
        {STAGES.map((stage) => (
          <g key={`${stage.id}-label`} className="pipeline-diagram__label">
            <line
              x1={cx + planeW + 10}
              y1={stage.y}
              x2="332"
              y2={stage.y}
              stroke={STROKE_SOFT}
            />
            <circle
              cx={cx + planeW + 10}
              cy={stage.y}
              r="2"
              fill="#1f1f1f"
              stroke={stage.id === activeStage ? STROKE : STROKE_SOFT}
            />
            <text
              x="340"
              y={stage.y + 4}
              className={`pipeline-diagram__label-text${stage.id === activeStage ? " is-active" : ""}`}
            >
              {stage.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
