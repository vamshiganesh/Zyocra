import "./PipelineHeroDiagram.css";

const STROKE = "rgba(232, 227, 213, 0.42)";
const STROKE_SOFT = "rgba(232, 227, 213, 0.28)";
const STROKE_FAINT = "rgba(232, 227, 213, 0.16)";
const FILL_SOFT = "rgba(232, 227, 213, 0.045)";
const FILL_PLANE = "rgba(232, 227, 213, 0.035)";

type Stage = {
  id: string;
  label: string;
  y: number;
};

/** Center of stack — shifted left so labels fit inside the viewBox. */
const CX = 168;
const PLANE_W = 104;
const PLANE_H = 48;
const DEPTH = 14;

const STAGES: Stage[] = [
  { id: "commit", label: "Commit", y: 148 },
  { id: "prove", label: "Prove", y: 308 },
  { id: "verify", label: "Verify", y: 468 },
  { id: "apply", label: "Apply", y: 628 },
];

function planeTop(y: number) {
  return `M ${CX} ${y - PLANE_H} L ${CX + PLANE_W} ${y} L ${CX} ${y + PLANE_H} L ${CX - PLANE_W} ${y} Z`;
}

function planeLeftEdge(y: number) {
  const d = DEPTH;
  return `M ${CX - PLANE_W} ${y} L ${CX - PLANE_W + d * 0.5} ${y + d} L ${CX + d * 0.5} ${y + PLANE_H + d} L ${CX} ${y + PLANE_H}`;
}

function planeRightEdge(y: number) {
  const d = DEPTH;
  return `M ${CX + PLANE_W} ${y} L ${CX + PLANE_W - d * 0.5} ${y + d} L ${CX - d * 0.5} ${y + PLANE_H + d} L ${CX} ${y + PLANE_H}`;
}

type Props = {
  activeStage?: string;
};

/** Isometric zkML pipeline diagram — full-bleed wireframe stack. */
export function PipelineHeroDiagram({ activeStage = "prove" }: Props) {
  const spineTop = STAGES[0].y - PLANE_H - 48;
  const spineBottom = STAGES[3].y + PLANE_H + 56;

  return (
    <figure className="pipeline-diagram" aria-label="Zyocra pipeline diagram">
      <svg
        className="pipeline-diagram__svg"
        viewBox="0 0 440 760"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Zyocra zkML pipeline</title>

        <line x1={CX} y1={spineTop} x2={CX} y2={spineBottom} stroke={STROKE_FAINT} strokeWidth="1" />
        <circle cx={CX} cy={spineTop} r="2" fill="#1a1a1a" stroke={STROKE_SOFT} />
        <circle cx={CX} cy={spineBottom} r="2" fill="#1a1a1a" stroke={STROKE_SOFT} />

        {STAGES.map((stage) => {
          const active = stage.id === activeStage;
          const stroke = active ? STROKE : STROKE_SOFT;
          const fill = active ? "rgba(232, 227, 213, 0.075)" : FILL_PLANE;

          return (
            <g key={stage.id} className={`pipeline-diagram__stage${active ? " is-active" : ""}`}>
              <path d={planeLeftEdge(stage.y)} stroke={STROKE_FAINT} fill={FILL_SOFT} strokeWidth="0.75" />
              <path
                d={planeRightEdge(stage.y)}
                stroke={STROKE_FAINT}
                fill="rgba(232,227,213,0.02)"
                strokeWidth="0.75"
              />
              <path d={planeTop(stage.y)} stroke={stroke} fill={fill} strokeWidth="1" />
              <circle cx={CX} cy={stage.y} r="2" fill="#1a1a1a" stroke={active ? STROKE : STROKE_SOFT} />
            </g>
          );
        })}

        {/* Commit — pyramid on plane */}
        <g
          className={`pipeline-diagram__shape${activeStage === "commit" ? " is-active" : ""}`}
          data-stage="commit"
        >
          {(() => {
            const y = STAGES[0].y;
            const apex = y - 48;
            const back = y - 20;
            const left = y - 4;
            const right = y - 4;
            const front = y + 12;
            return (
              <>
                <path
                  d={`M ${CX} ${apex} L ${CX - 26} ${left} L ${CX} ${front} L ${CX + 26} ${right} Z`}
                  stroke={STROKE}
                  fill={FILL_SOFT}
                  strokeWidth="1"
                />
                <path d={`M ${CX} ${apex} L ${CX} ${front}`} stroke={STROKE_SOFT} strokeWidth="0.75" />
                <path
                  d={`M ${CX - 26} ${left} L ${CX + 26} ${right}`}
                  stroke={STROKE_SOFT}
                  strokeWidth="0.75"
                />
                <path
                  d={`M ${CX} ${apex} L ${CX} ${back}`}
                  stroke={STROKE_FAINT}
                  strokeWidth="0.75"
                  strokeDasharray="4 5"
                />
                <path
                  d={`M ${CX - 26} ${left} L ${CX} ${back} L ${CX + 26} ${right}`}
                  stroke={STROKE_FAINT}
                  strokeWidth="0.75"
                  strokeDasharray="4 5"
                />
              </>
            );
          })()}
        </g>

        {/* Prove — hemisphere */}
        <g
          className={`pipeline-diagram__shape${activeStage === "prove" ? " is-active" : ""}`}
          data-stage="prove"
        >
          {(() => {
            const y = STAGES[1].y;
            const eq = y + 2;
            const apex = y - 30;
            const rx = 34;
            const ry = 11;
            return (
              <>
                <ellipse cx={CX} cy={eq} rx={rx} ry={ry} stroke={STROKE_SOFT} fill={FILL_SOFT} strokeWidth="0.75" />
                <path
                  d={`M ${CX - rx} ${eq} A ${rx} ${rx} 0 0 1 ${CX + rx} ${eq}`}
                  stroke={STROKE}
                  strokeWidth="1"
                />
                <path d={`M ${CX} ${apex} L ${CX - rx} ${eq}`} stroke={STROKE_SOFT} strokeWidth="0.75" />
                <path d={`M ${CX} ${apex} L ${CX + rx} ${eq}`} stroke={STROKE_SOFT} strokeWidth="0.75" />
                <path
                  d={`M ${CX - 18} ${y - 10} A 18 18 0 0 1 ${CX + 18} ${y - 10}`}
                  stroke={STROKE_FAINT}
                  strokeWidth="0.75"
                />
              </>
            );
          })()}
        </g>

        {/* Verify — flat hex ring */}
        <g
          className={`pipeline-diagram__shape${activeStage === "verify" ? " is-active" : ""}`}
          data-stage="verify"
        >
          {(() => {
            const y = STAGES[2].y;
            const outer = `M ${CX} ${y - 30}
              L ${CX + 26} ${y - 15}
              L ${CX + 26} ${y + 9}
              L ${CX} ${y + 24}
              L ${CX - 26} ${y + 9}
              L ${CX - 26} ${y - 15} Z`;
            const inner = `M ${CX} ${y - 16}
              L ${CX + 14} ${y - 8}
              L ${CX + 14} ${y + 5}
              L ${CX} ${y + 13}
              L ${CX - 14} ${y + 5}
              L ${CX - 14} ${y - 8} Z`;
            return (
              <>
                <path d={outer} stroke={STROKE} fill={FILL_SOFT} strokeWidth="1" />
                <path d={inner} stroke={STROKE_SOFT} fill="none" strokeWidth="0.75" />
              </>
            );
          })()}
        </g>

        {/* Apply — isometric cube */}
        <g
          className={`pipeline-diagram__shape${activeStage === "apply" ? " is-active" : ""}`}
          data-stage="apply"
        >
          {(() => {
            const y = STAGES[3].y;
            const e = 22;
            const top = y - 34;
            const base = y + 2;
            const skew = e * 0.5;
            return (
              <>
                <path
                  d={`M ${CX} ${top} L ${CX + e} ${top + skew} L ${CX} ${top + e} L ${CX - e} ${top + skew} Z`}
                  stroke={STROKE}
                  fill={FILL_SOFT}
                  strokeWidth="1"
                />
                <path
                  d={`M ${CX - e} ${top + skew} L ${CX - e} ${base} L ${CX} ${base + skew} L ${CX} ${top + e}`}
                  stroke={STROKE_SOFT}
                  fill="rgba(232,227,213,0.025)"
                  strokeWidth="0.75"
                />
                <path
                  d={`M ${CX + e} ${top + skew} L ${CX + e} ${base} L ${CX} ${base + skew} L ${CX} ${top + e}`}
                  stroke={STROKE_SOFT}
                  fill="rgba(232,227,213,0.02)"
                  strokeWidth="0.75"
                />
              </>
            );
          })()}
        </g>

        {/* Labels — kept inside viewBox with right margin */}
        {STAGES.map((stage) => {
          const active = stage.id === activeStage;
          const lineStart = CX + PLANE_W + 16;
          const lineEnd = 318;

          return (
            <g key={`${stage.id}-label`} className="pipeline-diagram__label">
              <line
                x1={lineStart}
                y1={stage.y}
                x2={lineEnd}
                y2={stage.y}
                stroke={active ? STROKE_SOFT : STROKE_FAINT}
                strokeWidth="0.75"
              />
              <circle
                cx={lineStart}
                cy={stage.y}
                r="1.75"
                fill="#1a1a1a"
                stroke={active ? STROKE : STROKE_SOFT}
              />
              <text
                x={lineEnd + 8}
                y={stage.y + 3.5}
                className={`pipeline-diagram__label-text${active ? " is-active" : ""}`}
              >
                {stage.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
