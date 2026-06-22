"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * A controlled decimal input that avoids the two common React number-input bugs:
 *  1. Leading zero stays when the user starts typing (e.g. "042")
 *  2. Decimal point gets stripped mid-entry (e.g. "3." collapses to "3")
 *
 * Internally stores a string so the user can type freely; converts to number
 * only on blur or when the value is unambiguously complete.
 */
export function DecimalInput({ value, onChange, className, ...props }: DecimalInputProps) {
  // Derive the initial display string from the numeric prop
  const numToStr = (n: number) => (n === 0 ? "" : String(n));

  const [display, setDisplay] = React.useState<string>(numToStr(value));
  const isFocused = React.useRef(false);

  // When the external value changes (e.g. form reset or auto-calculation)
  // and the field is NOT focused, sync the display string
  React.useEffect(() => {
    if (!isFocused.current) {
      setDisplay(numToStr(value));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(",", ".");
    // Allow: empty, digits only, or digits with a single dot (including trailing dot)
    if (!/^(\d*\.?\d*)$/.test(raw)) return;
    setDisplay(raw);
    const num = parseFloat(raw);
    onChange(isNaN(num) ? 0 : num);
  }

  function handleFocus() {
    isFocused.current = true;
    // Clear "0" so the user can type immediately without backspacing
    if (display === "0") setDisplay("");
  }

  function handleBlur() {
    isFocused.current = false;
    // Clean up trailing dot or empty → show "" for 0 (placeholder handles it)
    const num = parseFloat(display);
    setDisplay(isNaN(num) || num === 0 ? "" : String(num));
    onChange(isNaN(num) ? 0 : num);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(className)}
    />
  );
}
