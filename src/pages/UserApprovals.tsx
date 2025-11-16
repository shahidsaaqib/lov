import { useState, useEffect } from 'react';
import { authStorage, LocalUser, PagePermission } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Shield, Users, Edit, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserApprovals = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState(authStorage.getPendingUsers());
  const [allUsers, setAllUsers] = useState<LocalUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, PagePermission[]>>({});
  const [editingUser, setEditingUser] = useState<LocalUser | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<LocalUser | null>(null);
  const [tempPermissions, setTempPermissions] = useState<PagePermission[]>([]);

  const availablePages: { id: PagePermission; label: string; description: string }[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'View analytics and overview' },
    { id: 'medicines', label: 'Medicines', description: 'Manage inventory' },
    { id: 'billing', label: 'Billing', description: 'Process sales' },
    { id: 'refunds', label: 'Refunds', description: 'Handle refunds' },
    { id: 'expenses', label: 'Expenses', description: 'Track expenses' },
    { id: 'reports', label: 'Reports', description: 'View reports' },
    { id: 'audit-logs', label: 'Audit Logs', description: 'View activity logs' },
    { id: 'settings', label: 'Settings', description: 'System settings' },
  ];

  useEffect(() => {
    // Check if user is admin
    if (!authStorage.isAdmin()) {
      toast.error('Unauthorized: Admin access required');
      navigate('/dashboard');
      return;
    }
    refreshUsers();
  }, [navigate]);

  const refreshUsers = () => {
    setPendingUsers(authStorage.getPendingUsers());
    const users = authStorage.getAllUsers().filter(u => u.approved);
    setAllUsers(users);
  };

  const handleApprove = (userId: string) => {
    const role = selectedRole[userId] || 'cashier';
    const permissions = selectedPermissions[userId] || authStorage.getDefaultPermissions(role);
    const result = authStorage.approveUser(userId, role as any, permissions);
    if (result.success) {
      toast.success('User approved successfully');
      refreshUsers();
      setSelectedRole(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      setSelectedPermissions(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    } else {
      toast.error(result.error || 'Failed to approve user');
    }
  };

  const handleReject = (userId: string) => {
    const result = authStorage.rejectUser(userId);
    if (result.success) {
      toast.success('User rejected');
      refreshUsers();
    } else {
      toast.error(result.error || 'Failed to reject user');
    }
  };

  const handleRoleChange = () => {
    if (!editingUser || !newRole) return;

    const result = authStorage.changeUserRole(editingUser.id, newRole as any);
    if (result.success) {
      toast.success('User role updated successfully');
      refreshUsers();
      setEditingUser(null);
      setNewRole('');
    } else {
      toast.error(result.error || 'Failed to update user role');
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    const result = authStorage.rejectUser(userToDelete);
    if (result.success) {
      toast.success('User deleted successfully');
      refreshUsers();
      setUserToDelete(null);
    } else {
      toast.error(result.error || 'Failed to delete user');
    }
  };

  const handleUpdatePermissions = () => {
    if (!permissionsUser) return;

    const result = authStorage.updateUserPermissions(permissionsUser.id, tempPermissions);
    if (result.success) {
      toast.success('Permissions updated successfully');
      refreshUsers();
      setPermissionsUser(null);
      setTempPermissions([]);
    } else {
      toast.error(result.error || 'Failed to update permissions');
    }
  };

  const handleRoleChangeWithPermissions = (role: string, userId: string) => {
    setSelectedRole(prev => ({ ...prev, [userId]: role }));
    const defaultPerms = authStorage.getDefaultPermissions(role);
    setSelectedPermissions(prev => ({ ...prev, [userId]: defaultPerms }));
  };

  const togglePermission = (userId: string, permission: PagePermission) => {
    setSelectedPermissions(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission];
      return { ...prev, [userId]: updated };
    });
  };

  const toggleTempPermission = (permission: PagePermission) => {
    setTempPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      admin: { variant: 'destructive', label: 'Admin' },
      manager: { variant: 'default', label: 'Manager' },
      cashier: { variant: 'secondary', label: 'Cashier' },
      viewer: { variant: 'outline', label: 'Viewer' },
      pending: { variant: 'secondary', label: 'Pending' },
    };
    const config = variants[role] || variants.viewer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      admin: 'Full system access, can manage users',
      manager: 'Can manage inventory, view reports, process refunds',
      cashier: 'Can process sales, view medicines',
      viewer: 'Read-only access to reports and inventory',
    };
    return descriptions[role] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and approvals</p>
        </div>
      </div>

      {/* Security Warning */}
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="text-warning flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Current authentication uses local storage which can be manipulated client-side. 
            For production environments, consider enabling <strong>Lovable Cloud</strong> for proper server-side authentication and role-based access control.
          </p>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Approvals ({pendingUsers.length})
          </CardTitle>
          <CardDescription>New users waiting for approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending approvals</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Assign Role</TableHead>
                  <TableHead>Page Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Select
                        value={selectedRole[user.id] || 'cashier'}
                        onValueChange={(value) => handleRoleChangeWithPermissions(value, user.id)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Manager</span>
                              <span className="text-xs text-muted-foreground">Full inventory access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cashier">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Cashier</span>
                              <span className="text-xs text-muted-foreground">Process sales</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Viewer</span>
                              <span className="text-xs text-muted-foreground">Read-only access</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(selectedPermissions[user.id] || authStorage.getDefaultPermissions(selectedRole[user.id] || 'cashier')).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {availablePages.find(p => p.id === perm)?.label || perm}
                          </Badge>
                        ))}
                      </div>
                      <Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 text-xs"
                          onClick={() => {
                            const currentPerms = selectedPermissions[user.id] || authStorage.getDefaultPermissions(selectedRole[user.id] || 'cashier');
                            // Will open dialog
                          }}
                        >
                          <Key className="w-3 h-3 mr-1" />
                          Customize
                        </Button>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(user.id)}
                        className="gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(user.id)}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Users ({allUsers.length})
          </CardTitle>
          <CardDescription>Manage existing user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active users</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Page Access</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(user.role)}
                        <span className="text-xs text-muted-foreground">
                          {getRoleDescription(user.role)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(user.permissions || []).slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {availablePages.find(p => p.id === perm)?.label || perm}
                            </Badge>
                          ))}
                          {(user.permissions || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(user.permissions || []).length - 3} more
                            </Badge>
                          )}
                        </div>
                        {user.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-fit text-xs"
                            onClick={() => {
                              setPermissionsUser(user);
                              setTempPermissions(user.permissions || []);
                            }}
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Manage Access
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.approvedBy || '-'}</TableCell>
                    <TableCell>
                      {user.approvedAt ? formatDate(user.approvedAt) : formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUser(user);
                          setNewRole(user.role);
                        }}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Change Role
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUserToDelete(user.id)}
                          className="gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <AlertDialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Update the role for <strong>{editingUser?.username}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">{getRoleDescription('admin')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Manager</span>
                    <span className="text-xs text-muted-foreground">{getRoleDescription('manager')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="cashier">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Cashier</span>
                    <span className="text-xs text-muted-foreground">{getRoleDescription('cashier')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Viewer</span>
                    <span className="text-xs text-muted-foreground">{getRoleDescription('viewer')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>Update Role</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Permissions Dialog */}
      <Dialog open={!!permissionsUser} onOpenChange={(open) => !open && setPermissionsUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Manage Page Access - {permissionsUser?.username}
            </DialogTitle>
            <DialogDescription>
              Select which pages this user can access. Admin users have access to all pages by default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`perm-${page.id}`}
                    checked={tempPermissions.includes(page.id)}
                    onCheckedChange={() => toggleTempPermission(page.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`perm-${page.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {page.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">{page.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Selected: <strong>{tempPermissions.length}</strong> of {availablePages.length} pages
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserApprovals;
