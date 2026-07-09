"use client";

import { Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageToStorage } from "@/lib/supabase/storage";

type MultiImageInputProps = {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  required?: boolean;
};

export function MultiImageInput({
  label,
  value,
  onChange,
  required,
}: MultiImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function addUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setUrlInput("");
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError("");
    setUploading(true);
    try {
      const publicUrls = await Promise.all(files.map(uploadImageToStorage));
      onChange([...value, ...publicUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">
        Add multiple images via URL or upload. First image is the cover photo.
      </p>

      <div className="flex gap-2">
        <Input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addUrl}>
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {required && value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          At least one image is required.
        </p>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <div key={`${url.slice(0, 32)}-${index}`} className="relative">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
