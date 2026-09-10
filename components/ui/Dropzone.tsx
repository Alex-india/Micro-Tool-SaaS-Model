import React, { useRef, useState } from "react";
import { cn, formatBytes } from "@/lib/utils";
import { UploadCloud, File, X } from "lucide-react";
import { Button } from "./Button";

export interface DropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
  onDrop?: (files: File[]) => void;
  description?: string;
  helperText?: string;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  accept,
  multiple = false,
  maxFiles = 1,
  maxSizeMB = 50,
  onFilesSelected,
  onDrop,
  description,
  helperText = "Drag & drop file here or click to browse",
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMultiple = multiple || maxFiles > 1;
  const displayText = description || helperText;

  const notifyFiles = (files: File[]) => {
    if (onFilesSelected) onFilesSelected(files);
    if (onDrop) onDrop(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const valid = files.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    const newFiles = isMultiple ? [...selectedFiles, ...valid] : valid.slice(0, 1);
    setSelectedFiles(newFiles);
    notifyFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    notifyFiles(updated);
  };

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 bg-surface/50 hover:bg-surface hover:border-accent/60 group",
          isDragOver ? "border-accent bg-accent/10 scale-[1.01]" : "border-border",
          selectedFiles.length > 0 && "border-accent/40 bg-surface"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={isMultiple}
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-accent/40 transition-all duration-200">
          <UploadCloud className="w-6 h-6 text-accent" />
        </div>

        <p className="text-sm font-medium text-text-primary text-center mb-1">{displayText}</p>
        <p className="text-xs text-text-tertiary text-center">
          {accept ? `Accepted formats: ${accept}` : "All standard formats supported"} (Max {maxSizeMB}MB)
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-surface-raised border border-border rounded-lg text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="w-4 h-4 text-accent shrink-0" />
                <span className="truncate font-medium text-text-primary">{file.name}</span>
                <span className="text-text-tertiary text-[11px] shrink-0">
                  ({formatBytes(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="p-1 hover:bg-border rounded text-text-tertiary hover:text-error transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
