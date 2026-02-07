import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// AI Generation Hook (moved from useBlog)
const useAiGenerate = () => {
  return useMutation({
    mutationFn: async (payload: {
      type: 'product_description' | 'meta_tags';
      context: Record<string, string | undefined>;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-seo-generate', {
        body: payload,
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.result;
    },
  });
};

interface AiGenerateButtonProps {
  type: 'product_description' | 'meta_tags';
  context: Record<string, string | undefined>;
  onGenerated: (result: string | { meta_title: string; meta_description: string }) => void;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline";
}

const AiGenerateButton = ({
  type,
  context,
  onGenerated,
  disabled = false,
  size = "sm",
  variant = "ghost",
}: AiGenerateButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const generateMutation = useAiGenerate();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({ type, context });
      onGenerated(result);
      toast.success("AI content generated!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const tooltipText = {
    product_description: "Generate product description with AI",
    meta_tags: "Generate SEO meta tags with AI",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="gap-1"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {size !== "icon" && "AI Generate"}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText[type]}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default AiGenerateButton;
