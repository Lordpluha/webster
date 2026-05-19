import { focusRingClass } from "@/shared/lib/a11y";

export function SkipToContent() {
  return (
    <a href="#main-content" className={`skip-to-content ${focusRingClass}`}>
      Skip to main content
    </a>
  );
}
