import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-red-50/50 border border-red-100 rounded-xl text-center">
                    <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
                    <h3 className="text-sm font-semibold text-red-700 mb-1">
                        {this.props.title || "Failed to load component"}
                    </h3>
                    <p className="text-xs text-red-600/80 max-w-[250px] mx-auto">
                        {this.state.error?.message || "An unexpected rendering error occurred."}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                        className="mt-4 text-xs font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
