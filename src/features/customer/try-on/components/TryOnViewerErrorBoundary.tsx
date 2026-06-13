import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { fallback: ReactNode; children: ReactNode; onError?: () => void; resetKey: string | number; }
interface State { hasError: boolean; resetKey: string | number; }

export class TryOnViewerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey };
  static getDerivedStateFromError(): Partial<State> { return { hasError: true }; }
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { hasError: false, resetKey: props.resetKey } : null;
  }
  componentDidCatch(error: Error, info: ErrorInfo) { void error; void info; this.props.onError?.(); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
