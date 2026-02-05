import { memo, useCallback, useState } from "react";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_main: boolean;
  sort_order: number;
}

interface ImageGridProps {
  images: ImageItem[];
  onDelete: (id: string) => void;
  onSetMain: (id: string) => void;
  className?: string;
}

const ImageGridItem = memo(({ 
  image, 
  onDelete, 
  onSetMain 
}: { 
  image: ImageItem; 
  onDelete: () => void; 
  onSetMain: () => void;
}) => (
  <div
    className={cn(
      "relative group aspect-square rounded-lg overflow-hidden border-2 transition-colors",
      image.is_main ? "border-primary" : "border-transparent"
    )}
  >
    <img
      src={image.image_url}
      alt={image.alt_text || "Product image"}
      className="w-full h-full object-cover"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={onSetMain}
        disabled={image.is_main}
      >
        {image.is_main ? "Main" : "Set Main"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <div className="absolute top-2 left-2 cursor-grab">
      <GripVertical className="h-4 w-4 text-white drop-shadow" />
    </div>
  </div>
));

ImageGridItem.displayName = "ImageGridItem";

const ImageGrid = memo(({ images, onDelete, onSetMain, className }: ImageGridProps) => {
  const handleDelete = useCallback((id: string) => () => onDelete(id), [onDelete]);
  const handleSetMain = useCallback((id: string) => () => onSetMain(id), [onSetMain]);

  if (images.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No images uploaded yet
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-4 gap-4", className)}>
      {images.map((image) => (
        <ImageGridItem
          key={image.id}
          image={image}
          onDelete={handleDelete(image.id)}
          onSetMain={handleSetMain(image.id)}
        />
      ))}
    </div>
  );
});

ImageGrid.displayName = "ImageGrid";

export { ImageGrid };