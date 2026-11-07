import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Top-level crash guard.
 *
 * Class component by necessity: React has no functional equivalent for
 * `getDerivedStateFromError`. Without this, any throw in the tree blanks the
 * whole dispatch console.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No logging backend exists yet; the fallback UI below surfaces the failure
    // to the operator rather than failing silently. Wire this to a real error
    // reporter before production.
    void error;
    void info;
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex h-screen w-screen items-center justify-center p-6 text-slate-100"
      >
        {/*
          On-system, deliberately. The crash screen is the one moment the product
          is least able to explain itself, so it has to still look like the
          console — `.panel` and `.panel-inset` rather than a one-off slate-900
          card on a raw Tailwind shadow.
        */}
        <div className="panel w-full max-w-md space-y-5 p-6 shadow-elev-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-rose-800/70 bg-rose-950/60 p-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow text-rose-400/80">Console fault</p>
              <h1 className="mt-1 text-base font-extrabold text-slate-100">
                Telemetry console stopped
              </h1>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400">
            The dispatch interface hit an unrecoverable error. No alert or patient data was lost.
            Restoring the console re-mounts the interface from the last committed state.
          </p>

          <div className="panel-inset p-3">
            <p className="eyebrow">Error detail</p>
            {/*
              `pre-wrap` + `break-words`: an unbroken stack frame or a long URL
              used to run straight out of the card, because a <pre> neither
              wraps nor breaks by default.
            */}
            <pre className="data-num mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-rose-300">
              {error.message}
            </pre>
          </div>

          <button
            type="button"
            onClick={this.handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-rose-500"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Restore console
          </button>
        </div>
      </div>
    );
  }
}
