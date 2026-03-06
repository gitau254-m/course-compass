import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends (await import('react')).Component<any, { error: any }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', color: 'red', background: 'white', minHeight: '100vh' }}>
          <h2>CRASH ERROR — copy this and send to Claude:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);