"use client"

import { toast as sonnerToast } from "sonner"

/**
 * Toast helper functions using sonner
 * Usage:
 *   import { showToast, showSuccessToast, showErrorToast } from "@/components/ui/toast"
 *   showToast("Your message")
 *   showSuccessToast("Operation successful!")
 *   showErrorToast("Something went wrong")
 */

export function showToast(message: string, description?: string) {
  return sonnerToast(message, {
    description,
  })
}

export function showSuccessToast(message: string, description?: string) {
  return sonnerToast.success(message, {
    description,
  })
}

export function showErrorToast(message: string, description?: string) {
  return sonnerToast.error(message, {
    description,
  })
}

export function showWarningToast(message: string, description?: string) {
  return sonnerToast.warning(message, {
    description,
  })
}

export function showInfoToast(message: string, description?: string) {
  return sonnerToast.info(message, {
    description,
  })
}

export function showLoadingToast(message: string, description?: string) {
  return sonnerToast.loading(message, {
    description,
  })
}

// Re-export the base toast for advanced usage
export { toast } from "sonner"
