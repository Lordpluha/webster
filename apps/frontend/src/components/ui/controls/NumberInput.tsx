import { FC, InputHTMLAttributes, useId } from "react";

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  min?: number;
  max?: number;
  step?: number | string;
  unit?: string;
}

export const NumberInput: FC<NumberInputProps> = ({
  label,
  min,
  max,
  step = 1,
  unit,
  className = "",
  value,
  ...props
}) => {
  const safeValue = value ?? "";
  const inputId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
          {...props}
        />
        {unit && <span className="absolute right-3 text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
};
