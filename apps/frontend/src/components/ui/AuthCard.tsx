import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="glass-card-light rounded-3xl p-8 shadow-xl shadow-violet-200/40">
        <h1 className="text-center text-2xl font-bold text-violet-950">{title}</h1>
        <p className="mt-2 text-center text-sm text-violet-700/80">{subtitle}</p>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-violet-700">{footer}</div> : null}
      </div>
    </div>
  );
}

export function authInputClass() {
  return "mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-violet-950 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
}

export function authLabelClass() {
  return "text-sm font-semibold text-violet-900";
}

export function authPrimaryButtonClass(disabled?: boolean) {
  return `w-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110 ${disabled ? "cursor-not-allowed opacity-50" : ""}`;
}

export function authLinkClass() {
  return "font-semibold text-violet-600 hover:text-fuchsia-600";
}

export function authAlertErrorClass() {
  return "mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800";
}

export function authAlertSuccessClass() {
  return "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800";
}
