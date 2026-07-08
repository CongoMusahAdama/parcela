"use client";

type AlertOptions = {
  title: string;
  text?: string;
  html?: string;
  confirmText?: string;
  confirmButtonColor?: string;
};

let swalPromise: Promise<typeof import("sweetalert2").default> | null = null;

async function getSwal() {
  if (!swalPromise) {
    swalPromise = import("sweetalert2").then((m) => m.default);
  }
  return swalPromise;
}

const baseOptions = {
  buttonsStyling: true,
  customClass: {
    popup: "parcela-swal-popup",
    title: "parcela-swal-title",
    htmlContainer: "parcela-swal-text",
    confirmButton: "parcela-swal-confirm",
  },
  backdrop: "rgba(15, 23, 42, 0.45)",
};

function fireAlert(
  options: AlertOptions & {
    icon: "success" | "error" | "info" | "warning";
    defaultConfirmColor: string;
  }
) {
  return getSwal().then((Swal) =>
    Swal.fire({
      ...baseOptions,
      icon: options.icon,
      title: options.title,
      ...(options.html ? { html: options.html } : { text: options.text }),
      confirmButtonText:
        options.confirmText ??
        (options.icon === "error" || options.icon === "warning" ? "OK" : "Got it"),
      confirmButtonColor: options.confirmButtonColor ?? options.defaultConfirmColor,
    })
  );
}

export async function showSuccessAlert(options: AlertOptions) {
  await fireAlert({ ...options, icon: "success", defaultConfirmColor: "#0d9488" });
}

export async function showErrorAlert(options: AlertOptions) {
  await fireAlert({ ...options, icon: "error", defaultConfirmColor: "#dc2626" });
}

export async function showInfoAlert(options: AlertOptions) {
  await fireAlert({ ...options, icon: "info", defaultConfirmColor: "#0d9488" });
}

/** User-fixable input issues or failed actions — warning style, not a hard error. */
export async function showValidationAlert(options: AlertOptions) {
  await fireAlert({ ...options, icon: "warning", defaultConfirmColor: "#d97706" });
}

type ConfirmDialogOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  icon?: "question" | "warning";
};

export async function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const Swal = await getSwal();
  const result = await Swal.fire({
    ...baseOptions,
    icon: options.icon ?? "question",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? "Yes, continue",
    cancelButtonText: options.cancelText ?? "Cancel",
    confirmButtonColor: options.confirmButtonColor ?? "#0d9488",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });
  return result.isConfirmed;
}
