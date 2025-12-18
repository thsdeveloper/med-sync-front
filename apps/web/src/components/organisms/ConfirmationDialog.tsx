/**
 * ConfirmationDialog Organism Component
 *
 * A reusable confirmation dialog following atomic design principles.
 * Used for delete confirmations, destructive actions, and other confirmations.
 *
 * Features:
 * - Multiple variants (danger, warning, info)
 * - Loading state for async operations
 * - Customizable title, description, and button labels
 * - Accessible with proper ARIA attributes
 * - Keyboard navigation support
 */

"use client";

import React, { useCallback, useState } from "react";
import { AlertTriangle, Trash2, Info, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

/**
 * Variant configuration for different confirmation types
 */
type ConfirmationVariant = "danger" | "warning" | "info";

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  /** Callback when dialog is closed (cancel or backdrop click) */
  onClose: () => void;
  /** Callback when confirm button is clicked - can be async */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Visual variant - affects colors and icon */
  variant?: ConfirmationVariant;
  /** Custom confirm button label */
  confirmLabel?: string;
  /** Custom cancel button label */
  cancelLabel?: string;
  /** Show loading spinner on confirm button */
  isLoading?: boolean;
  /** Disable confirm button */
  confirmDisabled?: boolean;
  /** Additional content to render below description */
  children?: React.ReactNode;
}

/**
 * Variant-specific configuration
 */
const variantConfig: Record<
  ConfirmationVariant,
  {
    icon: React.ReactNode;
    iconContainerClass: string;
    confirmButtonVariant: "destructive" | "primary" | "secondary";
    defaultConfirmLabel: string;
  }
> = {
  danger: {
    icon: <Trash2 className="h-6 w-6 text-red-600" />,
    iconContainerClass: "bg-red-100",
    confirmButtonVariant: "destructive",
    defaultConfirmLabel: "Excluir",
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    iconContainerClass: "bg-yellow-100",
    confirmButtonVariant: "primary",
    defaultConfirmLabel: "Confirmar",
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" />,
    iconContainerClass: "bg-blue-100",
    confirmButtonVariant: "primary",
    defaultConfirmLabel: "Confirmar",
  },
};

/**
 * ConfirmationDialog - A reusable dialog for confirmations
 *
 * @example
 * ```tsx
 * // Basic delete confirmation
 * <ConfirmationDialog
 *   isOpen={isDeleteOpen}
 *   onClose={() => setIsDeleteOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir item"
 *   description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
 *   variant="danger"
 * />
 *
 * // With custom labels and loading
 * <ConfirmationDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   title="Confirmar ação"
 *   description="Deseja continuar com esta operação?"
 *   variant="warning"
 *   confirmLabel="Sim, continuar"
 *   cancelLabel="Não, voltar"
 *   isLoading={isSubmitting}
 * />
 * ```
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = "danger",
  confirmLabel,
  cancelLabel = "Cancelar",
  isLoading = false,
  confirmDisabled = false,
  children,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const [internalLoading, setInternalLoading] = useState(false);

  const effectiveLoading = isLoading || internalLoading;

  /**
   * Handle confirm action with optional async support
   */
  const handleConfirm = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // Let the parent handle errors
      console.error("Confirmation action failed:", error);
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[425px]"
        showCloseButton={false}
        data-testid="confirmation-dialog"
      >
        <DialogHeader className="flex flex-col items-center text-center sm:items-start sm:text-left">
          {/* Icon */}
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full mb-4",
              config.iconContainerClass
            )}
          >
            {config.icon}
          </div>

          {/* Title */}
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {title}
          </DialogTitle>

          {/* Description */}
          <DialogDescription className="mt-2 text-sm text-slate-600">
            {description}
          </DialogDescription>

          {/* Optional children content */}
          {children && <div className="mt-4 w-full">{children}</div>}
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={effectiveLoading}
            data-testid="confirmation-cancel-button"
          >
            {cancelLabel}
          </Button>

          {/* Confirm Button */}
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={confirmDisabled || effectiveLoading}
            data-testid="confirmation-confirm-button"
          >
            {effectiveLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {confirmLabel || config.defaultConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing confirmation dialog state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, data, openConfirmation, closeConfirmation } = useConfirmationDialog<string>();
 *
 *   const handleDelete = (itemId: string) => {
 *     openConfirmation(itemId);
 *   };
 *
 *   const confirmDelete = async () => {
 *     if (data) {
 *       await deleteItem(data);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={() => handleDelete("123")}>Delete</button>
 *       <ConfirmationDialog
 *         isOpen={isOpen}
 *         onClose={closeConfirmation}
 *         onConfirm={confirmDelete}
 *         title="Delete Item"
 *         description="Are you sure?"
 *         variant="danger"
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useConfirmationDialog<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const openConfirmation = useCallback((confirmData?: T) => {
    setData(confirmData ?? null);
    setIsOpen(true);
  }, []);

  const closeConfirmation = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data to allow for exit animation
    setTimeout(() => setData(null), 200);
  }, []);

  return {
    isOpen,
    data,
    openConfirmation,
    closeConfirmation,
  };
}

export default ConfirmationDialog;
