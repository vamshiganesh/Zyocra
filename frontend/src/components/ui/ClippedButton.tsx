import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import "./ClippedButton.css";

type Variant = "accent" | "surface" | "ink" | "ghost";
type Clip = "br" | "bl" | "tr" | "none";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  clip?: Clip;
  className?: string;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
  };

type LinkProps = CommonProps & {
  to: string;
};

export function ClippedButton(props: ButtonProps | LinkProps) {
  const {
    children,
    variant = "accent",
    clip = "br",
    className = "",
  } = props;
  const classes = `clip-btn clip-btn--${variant} clip-btn--clip-${clip} ${className}`.trim();

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }

  const { to: _to, ...buttonProps } = props as ButtonProps;
  return (
    <button type="button" {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
