import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Crown, 
  Briefcase, 
  UserPlus, 
  Pencil, 
  Trash2, 
  X,
  Check,
  Loader2,
  Shield,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Client, GroupMember, GroupMemberRole, RiskCategory } from '@/types/mfi';
import { useOrganisation } from '@/contexts/OrganisationContext';

interface GroupMembersModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleConfig: Record<GroupMemberRole, { label: string; icon: typeof Crown; variant: 'default' | 'secondary' | 'outline' }> = {
  LEADER: { label: 'Leader', icon: Crown, variant: 'default' },
  SECRETARY: { label: 'Secretary', icon: Briefcase, variant: 'secondary' },
  MEMBER: { label: 'Member', icon: Users, variant: 'outline' },
};

const riskConfig: Record<RiskCategory, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  LOW: { label: 'Low', variant: 'default' },
  MEDIUM: { label: 'Medium', variant: 'secondary' },
  HIGH: { label: 'High', variant: 'destructive' },
};

interface EditingMember {
  member_id: string;
  role: GroupMemberRole;
  first_name: string;
  last_name: string;
  ghana_card_number: string;
  ghana_card_expiry: string;
  date_of_birth: string;
  gender: 'M' | 'F';
  nationality: string;
  phone: string;
  occupation: string;
  risk_category: RiskCategory;
  source_of_funds: string;
}

export function GroupMembersModal({ client, open, onOpenChange }: GroupMembersModalProps) {
  const { selectedOrgId } = useOrganisation();
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ['group-members', client?.client_id],
    queryFn: async () => {
      if (!client?.client_id) return [];
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('client_id', client.client_id)
        .eq('is_active', true)
        .order('role', { ascending: true });
      
      if (error) throw error;
      return data as GroupMember[];
    },
    enabled: !!client?.client_id && open,
  });

  const updateMember = useMutation({
    mutationFn: async (member: EditingMember) => {
      const { error } = await supabase
        .from('group_members')
        .update({
          role: member.role,
          first_name: member.first_name,
          last_name: member.last_name,
          ghana_card_number: member.ghana_card_number,
          ghana_card_expiry: member.ghana_card_expiry,
          date_of_birth: member.date_of_birth,
          gender: member.gender,
          nationality: member.nationality,
          phone: member.phone || null,
          occupation: member.occupation,
          risk_category: member.risk_category,
          source_of_funds: member.source_of_funds,
        })
        .eq('member_id', member.member_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member updated successfully');
      queryClient.invalidateQueries({ queryKey: ['group-members', client?.client_id] });
      setEditingMember(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update member');
    },
  });

  const addMember = useMutation({
    mutationFn: async (member: Omit<EditingMember, 'member_id'>) => {
      if (!client?.client_id || !selectedOrgId) throw new Error('Missing client or org');
      
      const { error } = await supabase
        .from('group_members')
        .insert({
          org_id: selectedOrgId,
          client_id: client.client_id,
          role: member.role,
          first_name: member.first_name,
          last_name: member.last_name,
          ghana_card_number: member.ghana_card_number,
          ghana_card_expiry: member.ghana_card_expiry,
          date_of_birth: member.date_of_birth,
          gender: member.gender,
          nationality: member.nationality,
          phone: member.phone || null,
          occupation: member.occupation,
          risk_category: member.risk_category,
          source_of_funds: member.source_of_funds,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['group-members', client?.client_id] });
      setEditingMember(null);
      setIsAddingNew(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('group_members')
        .update({ is_active: false })
        .eq('member_id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['group-members', client?.client_id] });
      setMemberToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });

  const handleStartEdit = (member: GroupMember) => {
    setEditingMember({
      member_id: member.member_id,
      role: member.role,
      first_name: member.first_name,
      last_name: member.last_name,
      ghana_card_number: member.ghana_card_number,
      ghana_card_expiry: member.ghana_card_expiry,
      date_of_birth: member.date_of_birth,
      gender: member.gender,
      nationality: member.nationality,
      phone: member.phone || '',
      occupation: member.occupation,
      risk_category: member.risk_category,
      source_of_funds: member.source_of_funds,
    });
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    setEditingMember({
      member_id: '',
      role: 'MEMBER',
      first_name: '',
      last_name: '',
      ghana_card_number: '',
      ghana_card_expiry: '',
      date_of_birth: '',
      gender: 'M',
      nationality: 'Ghanaian',
      phone: '',
      occupation: '',
      risk_category: 'LOW',
      source_of_funds: '',
    });
    setIsAddingNew(true);
  };

  const handleSave = () => {
    if (!editingMember) return;
    
    // Validate required fields
    if (!editingMember.first_name || !editingMember.last_name || !editingMember.ghana_card_number ||
        !editingMember.ghana_card_expiry || !editingMember.date_of_birth || !editingMember.occupation ||
        !editingMember.source_of_funds) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isAddingNew) {
      const { member_id, ...memberData } = editingMember;
      addMember.mutate(memberData);
    } else {
      updateMember.mutate(editingMember);
    }
  };

  const handleCancel = () => {
    setEditingMember(null);
    setIsAddingNew(false);
  };

  const hasLeader = members?.some(m => m.role === 'LEADER') || false;
  const hasSecretary = members?.some(m => m.role === 'SECRETARY') || false;

  const getClientTypeLabel = () => {
    switch (client?.client_type) {
      case 'GROUP': return 'Group';
      case 'COOPERATIVE': return 'Cooperative';
      case 'SME': return 'Business';
      default: return 'Group';
    }
  };

  if (!client) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {client.group_name || `${client.first_name} ${client.last_name}`} - Members
            </DialogTitle>
            <DialogDescription>
              Manage members of this {getClientTypeLabel().toLowerCase()}. Each member requires full KYC.
            </DialogDescription>
          </DialogHeader>

          {/* Summary Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant={hasLeader ? 'default' : 'destructive'}>
              {hasLeader ? '✓' : '!'} Leader
            </Badge>
            <Badge variant={hasSecretary ? 'default' : 'destructive'}>
              {hasSecretary ? '✓' : '!'} Secretary
            </Badge>
            <Badge variant="outline">
              {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Add Member Button */}
          {!editingMember && (
            <Button variant="outline" onClick={handleStartAdd} className="w-fit">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}

          {/* Edit/Add Form */}
          {editingMember && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{isAddingNew ? 'Add New Member' : 'Edit Member'}</h4>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(v) => setEditingMember({ ...editingMember, role: v as GroupMemberRole })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEADER" disabled={hasLeader && editingMember.role !== 'LEADER'}>
                        Leader
                      </SelectItem>
                      <SelectItem value="SECRETARY" disabled={hasSecretary && editingMember.role !== 'SECRETARY'}>
                        Secretary
                      </SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    className="mt-1"
                    value={editingMember.first_name}
                    onChange={(e) => setEditingMember({ ...editingMember, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    className="mt-1"
                    value={editingMember.last_name}
                    onChange={(e) => setEditingMember({ ...editingMember, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Ghana Card *</label>
                  <Input
                    className="mt-1"
                    placeholder="GHA-123456789-0"
                    value={editingMember.ghana_card_number}
                    onChange={(e) => setEditingMember({ ...editingMember, ghana_card_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Card Expiry *</label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={editingMember.ghana_card_expiry}
                    onChange={(e) => setEditingMember({ ...editingMember, ghana_card_expiry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date of Birth *</label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={editingMember.date_of_birth}
                    onChange={(e) => setEditingMember({ ...editingMember, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Gender *</label>
                  <Select
                    value={editingMember.gender}
                    onValueChange={(v) => setEditingMember({ ...editingMember, gender: v as 'M' | 'F' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nationality</label>
                  <Input
                    className="mt-1"
                    value={editingMember.nationality}
                    onChange={(e) => setEditingMember({ ...editingMember, nationality: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    className="mt-1"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Occupation *</label>
                  <Input
                    className="mt-1"
                    value={editingMember.occupation}
                    onChange={(e) => setEditingMember({ ...editingMember, occupation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Risk Category *</label>
                  <Select
                    value={editingMember.risk_category}
                    onValueChange={(v) => setEditingMember({ ...editingMember, risk_category: v as RiskCategory })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low Risk</SelectItem>
                      <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                      <SelectItem value="HIGH">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Source of Funds *</label>
                  <Input
                    className="mt-1"
                    value={editingMember.source_of_funds}
                    onChange={(e) => setEditingMember({ ...editingMember, source_of_funds: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={updateMember.isPending || addMember.isPending}
                >
                  {(updateMember.isPending || addMember.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Check className="h-4 w-4 mr-2" />
                  {isAddingNew ? 'Add Member' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Members Table */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !members?.length ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No members found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleStartAdd}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Ghana Card</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const role = roleConfig[member.role];
                    const RoleIcon = role.icon;
                    const risk = riskConfig[member.risk_category];
                    
                    return (
                      <TableRow key={member.member_id}>
                        <TableCell>
                          <Badge variant={role.variant} className="gap-1">
                            <RoleIcon className="h-3 w-3" />
                            {role.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {member.ghana_card_number}
                        </TableCell>
                        <TableCell>{member.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={risk.variant}>{risk.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(member)}
                              disabled={!!editingMember}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMemberToDelete(member)}
                              disabled={!!editingMember}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.first_name} {memberToDelete?.last_name} from this {getClientTypeLabel().toLowerCase()}? 
              This action can be undone by contacting support.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToDelete && deleteMember.mutate(memberToDelete.member_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}