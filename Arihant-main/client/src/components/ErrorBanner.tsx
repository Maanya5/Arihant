import { AlertTriangle, RefreshCw, WifiOff, ServerCrash } from "lucide-react";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  type?: "network" | "server" | "notfound" | "generic";
}

const ERRORS = {
  network: {
    icon: WifiOff,
    title: "No Internet Connection",
    description: "Please check your connection and try again.",
  },
  server: {
    icon: ServerCrash,
    title: "Server Error",
    description: "Our server had a problem. Please try again in a moment.",
  },
  notfound: {
    icon: AlertTriangle,
    title: "Not Found",
    description: "The item you're looking for doesn't exist.",
  },
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
};

export default function ErrorBanner({
  message,
  onRetry,
  type = "generic",
}: ErrorBannerProps) {
  const config = ERRORS[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-400">
        <Icon size={28} />
      </div>
      <div>
        <h3 className="font-heading text-gray-800 text-xl mb-1">{config.title}</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">{message || config.description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-teal)] text-white rounded-xl font-bold text-sm hover:bg-[var(--color-teal)]/90 transition-all shadow-md shadow-[var(--color-teal)]/20"
        >
          <RefreshCw size={16} /> Retry
        </button>
      )}
    </div>
  );
}

/** Small inline error for inside forms or modals */
export function InlineError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium">
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
