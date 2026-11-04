import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  // 아이콘만 있는 버튼은 aria-label 이 필수다(SYSTEM.md 6절).
  iconOnly?: boolean;
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

function classes(p: Common): string {
  return [
    "btn",
    `btn-${p.variant ?? "secondary"}`,
    p.size === "lg" ? "btn-lg" : "",
    p.iconOnly ? "btn-icon-only" : "",
    p.block ? "btn-block" : "",
    p.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    loading?: boolean;
    loadingLabel?: string;
  };

export function Button({
  variant,
  size,
  icon,
  iconOnly,
  block,
  className,
  children,
  loading,
  loadingLabel,
  disabled,
  type,
  ...rest
}: ButtonProps) {
  if (iconOnly && !rest["aria-label"]) throw new Error("iconOnly 버튼에는 aria-label 이 필요하다.");
  return (
    <button
      type={type ?? "button"}
      className={classes({ variant, size, icon, iconOnly, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" label="" inline />
      ) : icon ? (
        <span aria-hidden="true">{icon}</span>
      ) : null}
      {iconOnly ? null : loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export type ButtonLinkProps = Common & {
  href: string;
  prefetch?: boolean;
  "data-testid"?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
};

export function ButtonLink({
  variant,
  size,
  icon,
  iconOnly,
  block,
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  if (iconOnly && !rest["aria-label"]) throw new Error("iconOnly 링크에는 aria-label 이 필요하다.");
  return (
    <Link
      href={href}
      className={classes({ variant, size, icon, iconOnly, block, className })}
      {...rest}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {iconOnly ? null : children}
    </Link>
  );
}
