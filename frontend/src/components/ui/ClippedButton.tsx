import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import "./ClippedButton.css";

type Variant = "accent" | "surface" | "ink" | "ghost";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    to?: undefined;
  };

type LinkProps = CommonProps & {
  to: string;
};

function ButtonLabel({ children }: { children: ReactNode }) {
  return (
    <span className="clip-btn__label">
      <span className="clip-btn__roll">
        <span className="clip-btn__line">{children}</span>
        <span className="clip-btn__line" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );
}

export function ClippedButton(props: ButtonProps | LinkProps) {
  const { children, variant = "accent", className = "" } = props;
  const classes = `clip-btn clip-btn--${variant} ${className}`.trim();

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        <ButtonLabel>{children}</ButtonLabel>
      </Link>
    );
  }

  const {
    children: _c,
    variant: _v,
    className: _className,
    to: _to,
    type = "button",
    ...rest
  } = props as ButtonProps & { to?: undefined };

  return (
    <button type={type} {...rest} className={classes}>
      <ButtonLabel>{children}</ButtonLabel>
    </button>
  );
}
