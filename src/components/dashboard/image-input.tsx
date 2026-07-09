"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageToStorage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

type ImageInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
};

export function ImageInput({
  id,
  label,
  value,
  onChange,
  required,
  hint,
}: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const publicUrl = await uploadImageToStorage(file);
      onChange(publicUrl);
      setMode("upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  }

  function clearImage() {
    onChange("");
    setError("");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("url")}
        >
          URL
        </Button>
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          disabled={uploading}
          onClick={() => {
            setMode("upload");
            fileRef.current?.click();
          }}
        >
          <Upload className="size-3.5" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {mode === "url" && (
        <Input
          id={id}
          type="url"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          required={required && !value}
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className={cn(
              "h-24 w-24 rounded-lg border border-border object-cover",
            )}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
