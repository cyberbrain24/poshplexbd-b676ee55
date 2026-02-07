import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;
