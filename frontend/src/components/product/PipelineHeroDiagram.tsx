import "./PipelineHeroDiagram.css";

const STROKE = "rgba(232, 227, 213, 0.38)";
const STROKE_SOFT = "rgba(232, 227, 213, 0.24)";
const STROKE_FAINT = "rgba(232, 227, 213, 0.14)";
const FILL_SOFT = "rgba(232, 227, 213, 0.04)";
const FILL_PLANE = "rgba(232, 227, 213, 0.03)";

type Stage = {
  id: string;
  label: string;
  y: number;
};

const CX = 152;
const PLANE_W = 118;
const PLANE_H = 54;
const DEPTH = 16;

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
  return `M ${CX - PLANE_W} ${y} L ${CX - PLANE_W + d * 0.55} ${y + d} L ${CX + d * 0.55} ${y + PLANE_H + d} L ${CX} ${y + PLANE_H}`;
}

function planeRightEdge(y: number) {
  const d = DEPTH;
  return `M ${CX + PLANE_W} ${y} L ${CX + PLANE_W - d * 0.55} ${y + d} L ${CX - d * 0.55} ${y + PLANE_H + d} L ${CX} ${y + PLANE_H}`;
}

function planeCross(y: number) {
  return [
    `M ${CX - PLANE_W * 0.55} ${y - PLANE_H * 0.12} L ${CX + PLANE_W * 0.55} ${y + PLANE_H * 0.12}`,
    `M ${CX + PLANE_W * 0.55} ${y - PLANE_H * 0.12} L ${CX - PLANE_W * 0.55} ${y + PLANE_H * 0.12}`,
  ];
}

type Props = {
  activeStage?: string;
};

/** Isometric zkML pipeline diagram — full-bleed wireframe stack. */
export function PipelineHeroDiagram({ activeStage = "prove" }: Props) {
  const spineTop = STAGES[0].y - PLANE_H - 52;
  const spineBottom = STAGES[3].y + PLANE_H + 72;

  return (
    <figure className="pipeline-diagram" aria-label="Zyocra pipeline diagram">
      <svg
        className="pipeline-diagram__svg"
        viewBox="0 0 400 760"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Zyocra zkML pipeline</title>

        {/* Spine */}
        <line x1={CX} y1={spineTop} x2={CX} y2={spineBottom} stroke={STROKE_FAINT} strokeWidth="1" />
        <circle cx={CX} cy={spineTop} r="2.5" fill="#1c1c1c" stroke={STROKE_SOFT} />
        <circle cx={CX} cy={spineBottom} r="2.5" fill="#1c1c1c" stroke={STROKE_SOFT} />

        {STAGES.map((stage) => {
          const active = stage.id === activeStage;
          const stroke = active ? STROKE : STROKE_SOFT;
          const fill = active ? "rgba(232, 227, 213, 0.07)" : FILL_PLANE;

          return (
            <g key={stage.id} className={`pipeline-diagram__stage${active ? " is-active" : ""}`}>
              <path d={planeLeftEdge(stage.y)} stroke={STROKE_FAINT} fill={FILL_SOFT} />
              <path d={planeRightEdge(stage.y)} stroke={STROKE_FAINT} fill="rgba(232,227,213,0.025)" />
              <path d={planeTop(stage.y)} stroke={stroke} fill={fill} />
              {planeCross(stage.y).map((d) => (
                <path key={d} d={d} stroke={STROKE_FAINT} strokeWidth="0.75" />
              ))}
              <circle cx={CX} cy={stage.y} r="2.5" fill="#1c1c1c" stroke={active ? STROKE : STROKE_SOFT} />
            </g>
          );
        })}

        {/* Commit — wireframe pyramid */}
        <g
          className={`pipeline-diagram__shape${activeStage === "commit" ? " is-active" : ""}`}
          data-stage="commit"
        >
          <path
            d={`M ${CX} ${STAGES[0].y - 52}
               L ${CX + 34} ${STAGES[0].y - 6}
               L ${CX} ${STAGES[0].y + 18}
               L ${CX - 34} ${STAGES[0].y - 6} Z`}
            stroke={STROKE}
            fill={FILL_SOFT}
          />
          <path d={`M ${CX} ${STAGES[0].y - 52} L ${CX} ${STAGES[0].y + 18}`} stroke={STROKE_SOFT} />
          <path
            d={`M ${CX - 34} ${STAGES[0].y - 6} L ${CX + 34} ${STAGES[0].y - 6}`}
            stroke={STROKE_SOFT}
          />
          <path
            d={`M ${CX - 34} ${STAGES[0].y - 6} L ${CX} ${STAGES[0].y + 18}`}
            stroke={STROKE_FAINT}
            strokeDasharray="3 4"
          />
          <path
            d={`M ${CX + 34} ${STAGES[0].y - 6} L ${CX} ${STAGES[0].y + 18}`}
            stroke={STROKE_FAINT}
            strokeDasharray="3 4"
          />
        </g>

        {/* Prove — wireframe hemisphere */}
        <g
          className={`pipeline-diagram__shape${activeStage === "prove" ? " is-active" : ""}`}
          data-stage="prove"
        >
          <ellipse
            cx={CX}
            cy={STAGES[1].y + 4}
            rx="38"
            ry="14"
            stroke={STROKE_SOFT}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${CX - 38} ${STAGES[1].y + 4} A 38 38 0 0 1 ${CX + 38} ${STAGES[1].y + 4}`}
            stroke={STROKE}
            fill="none"
          />
          <path d={`M ${CX} ${STAGES[1].y - 34} L ${CX - 38} ${STAGES[1].y + 4}`} stroke={STROKE_SOFT} />
          <path d={`M ${CX} ${STAGES[1].y - 34} L ${CX + 38} ${STAGES[1].y + 4}`} stroke={STROKE_SOFT} />
          <path
            d={`M ${CX - 22} ${STAGES[1].y - 8} A 22 22 0 0 1 ${CX + 22} ${STAGES[1].y - 8}`}
            stroke={STROKE_FAINT}
            fill="none"
          />
          <line
            x1={CX}
            y1={STAGES[1].y - 34}
            x2={CX}
            y2={STAGES[1].y + 4}
            stroke={STROKE_FAINT}
          />
        </g>

        {/* Verify — hollow hex nut */}
        <g
          className={`pipeline-diagram__shape${activeStage === "verify" ? " is-active" : ""}`}
          data-stage="verify"
        >
          <path
            d={`M ${CX} ${STAGES[2].y - 34}
               L ${CX + 30} ${STAGES[2].y - 17}
               L ${CX + 30} ${STAGES[2].y + 11}
               L ${CX} ${STAGES[2].y + 28}
               L ${CX - 30} ${STAGES[2].y + 11}
               L ${CX - 30} ${STAGES[2].y - 17} Z`}
            stroke={STROKE}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${CX} ${STAGES[2].y - 16}
               L ${CX + 16} ${STAGES[2].y - 7}
               L ${CX + 16} ${STAGES[2].y + 9}
               L ${CX} ${STAGES[2].y + 18}
               L ${CX - 16} ${STAGES[2].y + 9}
               L ${CX - 16} ${STAGES[2].y - 7} Z`}
            stroke={STROKE_SOFT}
            fill="none"
          />
          <line
            x1={CX + 30}
            y1={STAGES[2].y - 17}
            x2={CX + 22}
            y2={STAGES[2].y - 10}
            stroke={STROKE_FAINT}
          />
          <line
            x1={CX + 30}
            y1={STAGES[2].y + 11}
            x2={CX + 22}
            y2={STAGES[2].y + 4}
            stroke={STROKE_FAINT}
          />
          <line
            x1={CX - 30}
            y1={STAGES[2].y - 17}
            x2={CX - 22}
            y2={STAGES[2].y - 10}
            stroke={STROKE_FAINT}
          />
          <line
            x1={CX - 30}
            y1={STAGES[2].y + 11}
            x2={CX - 22}
            y2={STAGES[2].y + 4}
            stroke={STROKE_FAINT}
          />
        </g>

        {/* Apply — iso cube on platform */}
        <g
          className={`pipeline-diagram__shape${activeStage === "apply" ? " is-active" : ""}`}
          data-stage="apply"
        >
          <path
            d={`M ${CX} ${STAGES[3].y + 14} L ${CX + 44} ${STAGES[3].y + 36} L ${CX} ${STAGES[3].y + 58} L ${CX - 44} ${STAGES[3].y + 36} Z`}
            stroke={STROKE_SOFT}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${CX - 20} ${STAGES[3].y - 8} L ${CX + 4} ${STAGES[3].y - 20} L ${CX + 28} ${STAGES[3].y - 8} L ${CX + 4} ${STAGES[3].y + 4} Z`}
            stroke={STROKE}
            fill={FILL_SOFT}
          />
          <path
            d={`M ${CX + 4} ${STAGES[3].y - 20} L ${CX + 4} ${STAGES[3].y + 4} L ${CX + 28} ${STAGES[3].y - 8}`}
            stroke={STROKE_SOFT}
          />
          <path
            d={`M ${CX - 20} ${STAGES[3].y - 8} L ${CX - 20} ${STAGES[3].y + 16} L ${CX + 4} ${STAGES[3].y + 4}`}
            stroke={STROKE_SOFT}
          />
          <path
            d={`M ${CX + 4} ${STAGES[3].y + 4} L ${CX + 4} ${STAGES[3].y + 28} L ${CX + 28} ${STAGES[3].y + 16}`}
            stroke={STROKE_FAINT}
          />
          <path
            d={`M ${CX - 20} ${STAGES[3].y + 16} L ${CX + 4} ${STAGES[3].y + 28} L ${CX + 28} ${STAGES[3].y + 16}`}
            stroke={STROKE_FAINT}
          />
        </g>

        {/* Labels */}
        {STAGES.map((stage) => {
          const active = stage.id === activeStage;
          const lineStart = CX + PLANE_W + 14;
          const lineEnd = 368;

          return (
            <g key={`${stage.id}-label`} className="pipeline-diagram__label">
              <line
                x1={lineStart}
                y1={stage.y}
                x2={lineEnd}
                y2={stage.y}
                stroke={active ? STROKE_SOFT : STROKE_FAINT}
              />
              <circle
                cx={lineStart}
                cy={stage.y}
                r="2"
                fill="#1c1c1c"
                stroke={active ? STROKE : STROKE_SOFT}
              />
              <text
                x={lineEnd + 4}
                y={stage.y + 4}
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
