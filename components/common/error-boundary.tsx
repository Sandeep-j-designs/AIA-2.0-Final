import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Catches a render error so one broken screen doesn't leave a white page
 * (27 Oct 2026). Before this, any throw while rendering took the whole app
 * down with nothing on screen and no way back but a reload.
 *
 * `resetKey` clears the error when it changes — the route, typically — so
 * moving to another page recovers on its own.
 */
type Props = { children: React.ReactNode; resetKey?: string };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Production reports this to its error tracker; the prototype logs it.
    console.error("Screen failed to render", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey)
      this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        className="grid h-screen place-items-center bg-pi-page px-page"
      >
        <div className="max-w-[440px] space-y-3 text-center">
          <h1 className="text-h3 text-pi-ink">This screen didn’t load</h1>
          <p className="text-body text-pi-body">
            Something went wrong while drawing it. Your documents and drafts are
            safe. Try again, or go back to the Inbox.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => window.location.assign("/inbox")}
            >
              Go to Inbox
            </Button>
            <Button onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
