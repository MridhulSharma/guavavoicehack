"use client";

type LandingProps = {
  phone: string;
  onPhoneChange: (value: string) => void;
  objective: string;
  onObjectiveChange: (value: string) => void;
  onStart: () => void;
  canStart: boolean;
  starting: boolean;
  error: string | null;
};

/**
 * The greeting view. It collects exactly the two values /api/goal has always
 * required -- to_number and objective -- and hands them straight to the same
 * startCall in page.tsx; both fields stay editable in the app view afterwards.
 */
export function Landing({
  phone,
  onPhoneChange,
  objective,
  onObjectiveChange,
  onStart,
  canStart,
  starting,
  error,
}: LandingProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-2xl">
        <p className="view-enter hero-sub mb-3 text-center">
          Decibels, an ADA compliant tool to make your calls.
        </p>

        <h1 className="view-enter stagger-1 hero-title mb-9 text-center">
          Hello Mridhul! How can Decibels help you today?
        </h1>

        <form
          className="view-enter stagger-2 panel flex flex-col gap-5 p-6 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) onStart();
          }}
        >
          <div>
            <label className="field-label mb-2" htmlFor="landing-objective">
              What should the call accomplish?
            </label>
            <textarea
              id="landing-objective"
              value={objective}
              onChange={(e) => onObjectiveChange(e.target.value)}
              onKeyDown={(e) => {
                // Enter submits; Shift+Enter keeps its newline.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canStart) onStart();
                }
              }}
              rows={3}
              placeholder="Book a table for four at 7pm on Friday, and ask if they have a gluten-free menu"
              className="field field-lg resize-none"
            />
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <label className="field-label mb-2" htmlFor="landing-phone">
                Number to call
              </label>
              <input
                id="landing-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+15551234567"
                className="field field-lg"
              />
            </div>

            <button
              type="submit"
              disabled={!canStart}
              className="btn btn-primary btn-lg sm:ml-auto"
            >
              {starting ? "Starting the call…" : "Start the call"}
            </button>
          </div>

          <p className="text-fg-subtle text-[0.92rem]">
            Both fields are needed before the call can go out. You can nudge the
            agent at any point once it is live.
          </p>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-center text-danger">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
