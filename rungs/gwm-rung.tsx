/** Rung four is not in the thin slice. The tile stays so the ladder reads as four, and says so. */
export function GwmRung() {
  return (
    <div className="flex aspect-square items-center justify-center rounded-full border border-dashed border-line-strong p-6 text-center">
      <p className="text-12 text-text-3">
        Full build: a generated human on GWM-1 through Runway&apos;s avatar SDK. Not rendered in this slice.
      </p>
    </div>
  );
}
