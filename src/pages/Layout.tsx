import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { authStorage } from '@/lib/storage';

const Layout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authStorage.isLoggedIn()) {
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center px-6 sticky top-0 z-10 shadow-soft-sm">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
