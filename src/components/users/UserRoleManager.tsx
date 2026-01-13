import { useState } from 'react';
import { useOrgUsers, useUpdateUserRole, UserRole } from '@/hooks/useUserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Shield, User, Briefcase, Users, CreditCard, Settings } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'bg-destructive text-destructive-foreground' },
  MANAGER: { label: 'Manager', icon: Briefcase, color: 'bg-primary text-primary-foreground' },
  FIELD_OFFICER: { label: 'Field Officer', icon: Users, color: 'bg-accent text-accent-foreground' },
  TELLER: { label: 'Teller', icon: CreditCard, color: 'bg-secondary text-secondary-foreground' },
  BOARD_DIRECTOR: { label: 'Board Director', icon: User, color: 'bg-muted text-muted-foreground' },
};

const ALL_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'FIELD_OFFICER', 'TELLER', 'BOARD_DIRECTOR'];

export function UserRoleManager() {
  const { data: users, isLoading, error } = useOrgUsers();
  const updateRole = useUpdateUserRole();
  const [editingUser, setEditingUser] = useState<{ user_id: string; email: string; roles: UserRole[] } | null>(null);
  const [pendingRoles, setPendingRoles] = useState<UserRole[]>([]);

  const handleEditRoles = (user: { user_id: string; email: string; roles: UserRole[] }) => {
    setEditingUser(user);
    setPendingRoles([...user.roles]);
  };

  const handleToggleRole = (role: UserRole) => {
    setPendingRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;

    const currentRoles = editingUser.roles;
    const rolesToAdd = pendingRoles.filter(r => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter(r => !pendingRoles.includes(r));

    for (const role of rolesToAdd) {
      await updateRole.mutateAsync({ userId: editingUser.user_id, role, action: 'add' });
    }
    for (const role of rolesToRemove) {
      await updateRole.mutateAsync({ userId: editingUser.user_id, role, action: 'remove' });
    }

    setEditingUser(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load users: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Staff Roles
          </CardTitle>
          <CardDescription>
            Manage staff access levels and permissions within your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !users?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No users found in this organization
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.display_name || user.email}</p>
                        {user.display_name && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        ) : (
                          user.roles.map((role) => {
                            const config = ROLE_CONFIG[role];
                            const Icon = config.icon;
                            return (
                              <Badge key={role} variant="outline" className="gap-1">
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRoles(user)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Roles</DialogTitle>
            <DialogDescription>
              Update roles for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ALL_ROLES.map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              return (
                <div key={role} className="flex items-center space-x-3">
                  <Checkbox
                    id={role}
                    checked={pendingRoles.includes(role)}
                    onCheckedChange={() => handleToggleRole(role)}
                  />
                  <label
                    htmlFor={role}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{config.label}</span>
                  </label>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={updateRole.isPending}>
              {updateRole.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
