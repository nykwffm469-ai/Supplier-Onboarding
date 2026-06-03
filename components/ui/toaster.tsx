"use client";

import { CheckCircle, Info, X, XCircle } from "lucide-react";

import type { Toast, ToastVariant } from "@/lib/use-toast";
import { cn } from "@/lib/utils";

type ToastItemProps = {
  toast: Toast;
  onRemove: (id: string) => void;
};

const variantClasses: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
  error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200",
};

const VariantIcon: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = VariantIcon[toast.variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md text-sm max-w-sm animate-in slide-in-from-right fade-in duration-200",
        variantClasses[toast.variant]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 shrink-0 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

type ToasterProps = {
  toasts: Toast[];
  onRemove: (id: string) => void;
};

export function Toaster({ toasts, onRemove }: ToasterProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
