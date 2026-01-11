import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRoleManager } from '@/components/users/UserRoleManager';
import { ClientAssignmentManager } from '@/components/users/ClientAssignmentManager';
import { Shield, Users } from 'lucide-react';

export default function UserManagement() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Manage staff roles, permissions, and client assignments
        </p>
      </div>

      <Tabs defaultValue="roles" className="space-y-4 md:space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="roles" className="gap-1.5 md:gap-2 flex-1 sm:flex-initial">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Staff Roles</span>
            <span className="sm:hidden">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5 md:gap-2 flex-1 sm:flex-initial">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Client Assignments</span>
            <span className="sm:hidden">Assignments</span>
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
