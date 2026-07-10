const MAX_LOGO_BYTES = 400 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type OperatorLogoUploadResult = {
  dataUrl: string;
  fileName: string;
};

export function validateOperatorLogoFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return "Use a PNG, JPEG, or WebP image.";
  }
  if (file.size > MAX_LOGO_BYTES) {
    return "Logo must be 400 KB or smaller.";
  }
  return null;
}

export function readOperatorLogoFile(file: File): Promise<OperatorLogoUploadResult> {
  const validationError = validateOperatorLogoFile(file);
  if (validationError) {
    return Promise.reject(new Error(validationError));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl.startsWith("data:image/")) {
        reject(new Error("Could not read that image. Try another file."));
        return;
      }
      resolve({ dataUrl, fileName: file.name });
    };
    reader.onerror = () => reject(new Error("Could not read that image. Try again."));
    reader.readAsDataURL(file);
  });
}
