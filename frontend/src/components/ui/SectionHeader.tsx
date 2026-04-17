import "./SectionHeader.css";

type Props = {
  label: string;
  title: string;
  description?: string;
  tone?: "light" | "dark";
};

export function SectionHeader({
  label,
  title,
  description,
  tone = "light",
}: Props) {
  return (
    <header className={`section-header section-header--${tone}`}>
      <div className="section-header__hatch hatch" aria-hidden="true" />
      <div className="section-header__row">
        <div className="section-header__copy">
          <p className="section-header__label mono-label label-dot">{label}</p>
          <h2 className="section-header__title">{title}</h2>
        </div>
        {description ? (
          <p className="section-header__desc">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
