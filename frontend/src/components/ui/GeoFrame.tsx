import "./GeoFrame.css";

type Variant = "pyramid" | "rings" | "hex" | "waves";

type Props = {
  variant?: Variant;
  caption?: string;
};

export function GeoFrame({ variant = "pyramid", caption }: Props) {
  return (
    <div className="geo-frame dot-grid">
      <svg
        className="geo-frame__svg"
        viewBox="0 0 160 160"
        fill="none"
        aria-hidden="true"
      >
        {variant === "pyramid" ? (
          <>
            <path d="M80 28L128 118H32L80 28Z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M80 28V118" stroke="currentColor" strokeWidth="1.2" />
            <path d="M56 73H104" stroke="currentColor" strokeWidth="1.2" />
          </>
        ) : null}
        {variant === "rings" ? (
          <>
            <circle cx="80" cy="80" r="46" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="80" cy="80" r="30" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="80" cy="80" r="14" stroke="currentColor" strokeWidth="1.2" />
          </>
        ) : null}
        {variant === "hex" ? (
          <path
            d="M80 28L118 52V100L80 124L42 100V52L80 28Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        ) : null}
        {variant === "waves" ? (
          <>
            <path d="M20 110C40 70 60 70 80 110C100 150 120 150 140 110" stroke="currentColor" strokeWidth="1.2" />
            <path d="M20 90C40 50 60 50 80 90C100 130 120 130 140 90" stroke="currentColor" strokeWidth="1.2" />
            <path d="M20 70C40 30 60 30 80 70C100 110 120 110 140 70" stroke="currentColor" strokeWidth="1.2" />
          </>
        ) : null}
      </svg>
      {caption ? <p className="geo-frame__caption mono-label">{caption}</p> : null}
    </div>
  );
}
