import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Receipt,
  DollarSign,
  LogOut,
  Activity,
  Wifi,
  WifiOff,
  History,
  Shield,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authStorage, PagePermission } from '@/lib/storage';
import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const currentPath = location.pathname;
  const isAdmin = authStorage.isAdmin();

  const menuItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' as PagePermission },
    { title: 'Medicines', url: '/medicines', icon: Package, permission: 'medicines' as PagePermission },
    { title: 'Billing', url: '/billing', icon: ShoppingCart, permission: 'billing' as PagePermission },
    { title: 'Refunds', url: '/refunds', icon: Receipt, permission: 'refunds' as PagePermission },
    { title: 'Expenses', url: '/expenses', icon: DollarSign, permission: 'expenses' as PagePermission },
    { title: 'Reports', url: '/reports', icon: FileText, permission: 'reports' as PagePermission },
    { title: 'Audit Logs', url: '/audit-logs', icon: History, permission: 'audit-logs' as PagePermission },
    ...(isAdmin ? [{ title: 'User Approvals', url: '/user-approvals', icon: Shield, permission: null }] : []),
  ].filter(item => !item.permission || authStorage.hasPagePermission(item.permission));

  const handleLogout = () => {
    authStorage.logout();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sidebar-foreground truncate">Medical POS</h2>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 space-y-2 border-t border-sidebar-border">
          {authStorage.hasPagePermission('settings') && (
            <Button
              variant="ghost"
              size={open ? 'default' : 'icon'}
              onClick={() => navigate('/settings')}
              className="w-full justify-start"
            >
              <Settings className="h-4 w-4" />
              {open && <span className="ml-2">Settings</span>}
            </Button>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-warning" />
            )}
            {open && (
              <span className="text-sidebar-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size={open ? 'default' : 'icon'}
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
            {open && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
