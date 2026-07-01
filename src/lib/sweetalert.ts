"use client";

type AlertOptions = {
  title: string;
  text?: string;
  confirmText?: string;
};

let swalPromise: Promise<typeof import("sweetalert2").default> | null = null;

async function getSwal() {
  if (!swalPromise) {
    swalPromise = import("sweetalert2").then((m) => m.default);
  }
  return swalPromise;
}

const baseOptions = {
  confirmButtonColor: "#0d9488",
  buttonsStyling: true,
  customClass: {
    popup: "parcela-swal-popup",
    title: "parcela-swal-title",
    htmlContainer: "parcela-swal-text",
    confirmButton: "parcela-swal-confirm",
  },
  backdrop: "rgba(15, 23, 42, 0.45)",
};

export async function showSuccessAlert(options: AlertOptions) {
  const Swal = await getSwal();
  await Swal.fire({
    ...baseOptions,
    icon: "success",
    title: options.title,
    text: options.text,
    confirmButtonText: options.confirmText ?? "Got it",
  });
}

export async function showErrorAlert(options: AlertOptions) {
  const Swal = await getSwal();
  await Swal.fire({
    ...baseOptions,
    icon: "error",
    confirmButtonColor: "#dc2626",
    title: options.title,
    text: options.text,
    confirmButtonText: options.confirmText ?? "OK",
  });
}
