import BulkProductUpload from "@/components/admin/BulkProductUpload";

const AdminBulkUpload = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Bulk Product Upload</h1>
        <p className="text-muted-foreground mt-1">
          Import products from CSV or Excel files
        </p>
      </div>
      <BulkProductUpload />
    </div>
  );
};

export default AdminBulkUpload;
