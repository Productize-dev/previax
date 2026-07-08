const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error("Please upload a JPG, PNG, WebP, or GIF image."));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      reject(new Error(`Image must be under ${MAX_FILE_SIZE_MB}MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export function getPrimaryImage(imageUrls: string[]): string {
  return imageUrls[0] ?? "";
}
