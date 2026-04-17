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
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
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

  const {
    children: _c,
    variant: _v,
    clip: _clip,
    className: _className,
    to: _to,
    ...rest
  } = props as ButtonProps & { to?: undefined };

  return (
    <button type="button" {...rest} className={classes}>
      {children}
    </button>
  );
}
