import { useState } from "react";
import type { Upload } from "@/app/create/interface";

export function useUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);

  const addUploads = (files: FileList | null) => {
    if (!files) return;
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    setUploads((prev) => [
      ...prev,
      ...imgs.map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), name: f.name })),
    ]);
  };

  return { uploads, addUploads };
}
