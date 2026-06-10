import AIProviderCredentialsPanel from "@/components/admin/AIProviderCredentialsPanel";

const AIProviderCredentials = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">AI Provider Credentials</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage API keys for Gemini, OpenAI, Anthropic, and OpenRouter used across the admin AI tools.
        </p>
      </div>
      <AIProviderCredentialsPanel />
    </div>
  );
};

export default AIProviderCredentials;
