import AdminProductAI from "@/components/admin/AdminProductAI";

export default function AdminAIAssistant() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase">Product AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chat to manage your product catalog. Read-only questions work instantly; create / edit / delete actions ask for your approval first.
        </p>
      </div>
      <AdminProductAI />
    </div>
  );
}
