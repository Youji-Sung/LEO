import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { CircleAlert } from "lucide-react";

type FieldShell = {
  id: string;
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string | null;
  children?: ReactNode;
};

function describedBy(id: string, hint?: string, error?: string | null): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function Shell({ id, label, hideLabel, hint, error, children }: FieldShell) {
  return (
    <div className="field">
      <label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="field-error" role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </span>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<FieldShell, "children"> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function TextField({ id, label, hideLabel, hint, error, ...input }: TextFieldProps) {
  return (
    <Shell id={id} label={label} hideLabel={hideLabel} hint={hint} error={error}>
      <input
        id={id}
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        {...input}
      />
    </Shell>
  );
}

type TextAreaProps = Omit<FieldShell, "children"> &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextArea({ id, label, hideLabel, hint, error, ...area }: TextAreaProps) {
  return (
    <Shell id={id} label={label} hideLabel={hideLabel} hint={hint} error={error}>
      <textarea
        id={id}
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        {...area}
      />
    </Shell>
  );
}

type SelectProps = Omit<FieldShell, "children"> &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { children: ReactNode };

export function Select({ id, label, hideLabel, hint, error, children, ...select }: SelectProps) {
  return (
    <Shell id={id} label={label} hideLabel={hideLabel} hint={hint} error={error}>
      <select
        id={id}
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        {...select}
      >
        {children}
      </select>
    </Shell>
  );
}
