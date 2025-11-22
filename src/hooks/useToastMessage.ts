"use client";

import { useCallback } from "react";
import { toast } from "sonner";

type ToastPayload = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const defaultDuration = 4500;

export const useToastMessage = () => {
  const notifySuccess = useCallback(
    (title: string, payload?: ToastPayload) =>
      toast.success(title, {
        duration: payload?.duration ?? defaultDuration,
        description: payload?.description,
        action: payload?.action,
      }),
    []
  );

  const notifyError = useCallback(
    (title: string, payload?: ToastPayload) =>
      toast.error(title, {
        duration: payload?.duration ?? defaultDuration,
        description: payload?.description,
        action: payload?.action,
      }),
    []
  );

  const notifyInfo = useCallback(
    (title: string, payload?: ToastPayload) =>
      toast(title, {
        duration: payload?.duration ?? defaultDuration,
        description: payload?.description,
        action: payload?.action,
      }),
    []
  );

  return { notifySuccess, notifyError, notifyInfo };
};

