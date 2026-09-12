import { ReactNode, useState } from "react";

/* ---------------- Collapsible panel section (Figma-style) ---------------- */
export function Section({
  title,
  children,
  action,
  defaultOpen = true,
  dense = false,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  defaultOpen?: boolean;
  dense?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#2c2c2c]">
      <div className="flex h-9 items-center justify-between px-3">
        <button
          onClick={() => setOpen(!open)}
          className="group flex flex-1 items-center gap-1.5 text-left"
        >
          <svg
            viewBox="0 0 12 12"
            className={`h-2.5 w-2.5 shrink-0 text-[#8c8c8c] transition-transform ${open ? "rotate-90" : ""}`}
            fill="currentColor"
          >
            <path d="M4 2l4 4-4 4z" />
          </svg>
          <span className="text-[11px] font-semibold tracking-wide text-[#e6e6e6]">
            {title}
          </span>
        </button>
        {action}
      </div>
      {open && <div className={dense ? "px-3 pb-3" : "space-y-3 px-3 pb-3.5"}>{children}</div>}
    </div>
  );
}

/* ---------------- Label + control row ---------------- */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[70px] shrink-0 text-[11px] text-[#a0a0a0]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  );
}

/* ---------------- Numeric input ---------------- */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
  prefix,
  suffix,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-7 min-w-0 flex-1 items-center gap-1 rounded-[5px] border border-transparent bg-[#2c2c2c] px-2 transition focus-within:border-[#0d99ff] hover:border-[#3d3d3d] ${className}`}
    >
      {prefix && <span className="shrink-0 text-[10px] font-medium text-[#7a7a7a]">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="w-full min-w-0 bg-transparent text-[11px] tabular-nums text-[#e6e6e6] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="shrink-0 text-[10px] text-[#7a7a7a]">{suffix}</span>}
    </div>
  );
}

/* ---------------- Text input ---------------- */
export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-full min-w-0 rounded-[5px] border border-transparent bg-[#2c2c2c] px-2 text-[11px] text-[#e6e6e6] outline-none transition placeholder:text-[#6b6b6b] focus:border-[#0d99ff] hover:border-[#3d3d3d]"
    />
  );
}

/* ---------------- Slider with inline value box ---------------- */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="w-[70px] shrink-0 text-[11px] text-[#a0a0a0]">{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rt-range h-1 min-w-0 flex-1"
        />
        <div className="flex h-7 w-[52px] shrink-0 items-center justify-center rounded-[5px] bg-[#2c2c2c] text-[11px] tabular-nums text-[#e6e6e6]">
          {value}
          {suffix}
        </div>
      </div>
      {hint && <p className="mt-1 pl-[78px] text-[10px] leading-tight text-[#6b6b6b]">{hint}</p>}
    </div>
  );
}

/* ---------------- Segmented control ---------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex h-7 w-full rounded-[5px] bg-[#2c2c2c] p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-[3px] text-[11px] font-medium transition ${
            value === o.id
              ? "bg-[#0d99ff] text-white shadow-sm"
              : "text-[#a0a0a0] hover:text-[#e6e6e6]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Select ---------------- */
export function Select<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative h-7 min-w-0 flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-7 w-full cursor-pointer appearance-none rounded-[5px] border border-transparent bg-[#2c2c2c] pl-2 pr-6 text-[11px] text-[#e6e6e6] outline-none transition focus:border-[#0d99ff] hover:border-[#3d3d3d]"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} className="bg-[#2c2c2c]">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-[#8c8c8c]"
        fill="currentColor"
      >
        <path d="M2 4.5l4 4 4-4z" />
      </svg>
    </div>
  );
}

/* ---------------- Checkbox ---------------- */
export function Check({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-2 text-left"
    >
      <span
        className={`mt-[1px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition ${
          checked ? "border-[#0d99ff] bg-[#0d99ff]" : "border-[#4a4a4a] bg-transparent"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M2.5 6.2l2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] leading-tight text-[#e6e6e6]">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] leading-tight text-[#6b6b6b]">{hint}</span>}
      </span>
    </button>
  );
}

/* ---------------- Buttons ---------------- */
export function Button({
  children,
  onClick,
  variant = "default",
  disabled,
  full,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost" | "danger";
  disabled?: boolean;
  full?: boolean;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium transition select-none disabled:opacity-40 disabled:pointer-events-none";
  const sizes = size === "sm" ? "h-6 px-2 text-[10px]" : "h-7 px-3 text-[11px]";
  const variants = {
    default: "bg-[#383838] text-[#e6e6e6] hover:bg-[#454545]",
    primary: "bg-[#0d99ff] text-white hover:bg-[#3fadff]",
    ghost: "bg-transparent text-[#a0a0a0] hover:bg-[#2c2c2c] hover:text-[#e6e6e6]",
    danger: "bg-[#3a2323] text-[#ff9b9b] hover:bg-[#4a2b2b]",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${variants} ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-[6px] transition ${
        active ? "bg-[#0d99ff] text-white" : "text-[#a0a0a0] hover:bg-[#2c2c2c] hover:text-[#e6e6e6]"
      }`}
    >
      {children}
    </button>
  );
}
