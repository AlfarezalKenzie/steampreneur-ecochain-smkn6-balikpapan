"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ControlProps = { id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string };

/**
 * Label, kontrol, dan pesan bantuan/kesalahan. Label terhubung ke kontrol lewat id (pembaca layar
 * dan klik pada label bekerja), dan pesan kesalahan diumumkan sebagai role="alert".
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
  children: React.ReactElement<ControlProps>;
}) {
  const id = React.useId();
  const messageId = `${id}-msg`;
  const hasMessage = Boolean(error || hint);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hasMessage ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-xs text-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const fieldBase =
  "h-10 w-full rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal disabled:bg-surface-sunken";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(fieldBase, error ? "border-critical" : "border-hairline", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(fieldBase, error ? "border-critical" : "border-hairline", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
