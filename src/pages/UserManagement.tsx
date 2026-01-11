import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRoleManager } from '@/components/users/UserRoleManager';
import { ClientAssignmentManager } from '@/components/users/ClientAssignmentManager';
import { Shield, Users } from 'lucide-react';

export default function UserManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage staff roles, permissions, and client assignments
        </p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Staff Roles
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Users className="h-4 w-4" />
            Client Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <UserRoleManager />
        </TabsContent>

        <TabsContent value="assignments">
          <ClientAssignmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
