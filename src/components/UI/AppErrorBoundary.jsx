import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught a runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-white px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Application Recovery
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              This page hit an unexpected error.
            </h1>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
              Refresh the page to try again. If the problem continues, the latest deployment may still be updating.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white"
            >
              Reload Page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
