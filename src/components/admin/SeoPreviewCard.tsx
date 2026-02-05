interface SeoPreviewCardProps {
  title: string;
  description: string;
  url: string;
}

const SeoPreviewCard = ({ title, description, url }: SeoPreviewCardProps) => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground mb-2">Google Preview</p>
      <div className="bg-background p-4 rounded border">
        <p className="text-primary text-lg hover:underline cursor-pointer truncate">
          {title || "Page Title"}
        </p>
        <p className="text-muted-foreground text-sm truncate">
          https://{url || "poshplex.lovable.app/blog/..."}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {description || "Meta description will appear here..."}
        </p>
      </div>
    </div>
  );
};

export default SeoPreviewCard;
