import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Subsystem caught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-cyber-card/95 border-2 border-cyber-danger/60 rounded-xl shadow-[0_0_30px_rgba(255,0,85,0.25)] text-center max-w-lg mx-auto my-12 font-mono">
          <div className="flex justify-center mb-3">
            <span className="p-3 bg-cyber-danger/10 border border-cyber-danger/40 rounded-full text-cyber-danger animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </span>
          </div>

          <h2 className="font-hud font-extrabold text-sm text-cyber-danger tracking-wider uppercase mb-1">
            {this.props.fallbackTitle || 'SUBSYSTEM RUNTIME FAULT'}
          </h2>

          <p className="text-xs text-slate-400 mb-4">
            An isolated component failure occurred. Core proxy shielding remains unaffected.
          </p>

          <div className="bg-black/80 border border-slate-800 p-3 rounded text-[11px] text-cyber-danger/90 font-mono text-left overflow-x-auto mb-4">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center px-4 py-2 bg-cyber-danger/20 border border-cyber-danger text-cyber-danger hover:bg-cyber-danger hover:text-white rounded text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(255,0,85,0.3)]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
            REBOOT SUBSYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
