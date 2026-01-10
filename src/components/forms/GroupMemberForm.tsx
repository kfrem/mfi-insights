import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, UserPlus, Users, Crown, Briefcase } from 'lucide-react';
import { GroupMemberRole } from '@/types/mfi';

// Ghana Card format: GHA-XXXXXXXXX-X (13 digits)
const ghanaCardRegex = /^GHA-\d{9}-\d$/;

export interface MemberData {
  role: GroupMemberRole;
  first_name: string;
  last_name: string;
  ghana_card_number: string;
  ghana_card_expiry: string;
  date_of_birth: string;
  gender: 'M' | 'F';
  nationality: string;
  phone: string;
  email: string;
  occupation: string;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH';
  source_of_funds: string;
}

interface GroupMemberFormProps {
  members: MemberData[];
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onUpdateMember: (index: number, field: keyof MemberData, value: string) => void;
  clientType: 'GROUP' | 'COOPERATIVE' | 'SME';
}

const emptyMember: MemberData = {
  role: 'MEMBER',
  first_name: '',
  last_name: '',
  ghana_card_number: '',
  ghana_card_expiry: '',
  date_of_birth: '',
  gender: 'M',
  nationality: 'Ghanaian',
  phone: '',
  email: '',
  occupation: '',
  risk_category: 'LOW',
  source_of_funds: '',
};

export function GroupMemberForm({
  members,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  clientType,
}: GroupMemberFormProps) {
  const getClientTypeLabel = () => {
    switch (clientType) {
      case 'GROUP':
        return 'Group';
      case 'COOPERATIVE':
        return 'Cooperative';
      case 'SME':
        return 'Business';
      default:
        return 'Group';
    }
  };

  const getRoleIcon = (role: GroupMemberRole) => {
    switch (role) {
      case 'LEADER':
        return <Crown className="h-4 w-4" />;
      case 'SECRETARY':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: GroupMemberRole) => {
    switch (role) {
      case 'LEADER':
        return 'default';
      case 'SECRETARY':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const hasLeader = members.some(m => m.role === 'LEADER');
  const hasSecretary = members.some(m => m.role === 'SECRETARY');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {getClientTypeLabel()} Members
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add members with full KYC. Requires at least a Leader and Secretary.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddMember}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Validation Summary */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant={hasLeader ? 'default' : 'destructive'}>
          {hasLeader ? '✓' : '!'} Leader {hasLeader ? 'assigned' : 'required'}
        </Badge>
        <Badge variant={hasSecretary ? 'default' : 'destructive'}>
          {hasSecretary ? '✓' : '!'} Secretary {hasSecretary ? 'assigned' : 'required'}
        </Badge>
        <Badge variant="outline">
          {members.length} member{members.length !== 1 ? 's' : ''} total
        </Badge>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No members added yet</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onAddMember}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add First Member
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {members.map((member, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{member.role}</span>
                  </Badge>
                  {member.first_name && member.last_name && (
                    <span className="text-sm font-medium">
                      {member.first_name} {member.last_name}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <Select
                    value={member.role}
                    onValueChange={(value) => onUpdateMember(index, 'role', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEADER" disabled={hasLeader && member.role !== 'LEADER'}>
                        Leader (Primary Contact)
                      </SelectItem>
                      <SelectItem value="SECRETARY" disabled={hasSecretary && member.role !== 'SECRETARY'}>
                        Secretary/Treasurer
                      </SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    className="mt-1"
                    placeholder="Kwame"
                    value={member.first_name}
                    onChange={(e) => onUpdateMember(index, 'first_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    className="mt-1"
                    placeholder="Asante"
                    value={member.last_name}
                    onChange={(e) => onUpdateMember(index, 'last_name', e.target.value)}
                  />
                </div>
              </div>

              {/* Ghana Card Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Ghana Card Number *</label>
                  <Input
                    className="mt-1"
                    placeholder="GHA-123456789-0"
                    value={member.ghana_card_number}
                    onChange={(e) => onUpdateMember(index, 'ghana_card_number', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ghana Card Expiry *</label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={member.ghana_card_expiry}
                    onChange={(e) => onUpdateMember(index, 'ghana_card_expiry', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date of Birth *</label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={member.date_of_birth}
                    onChange={(e) => onUpdateMember(index, 'date_of_birth', e.target.value)}
                  />
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Gender *</label>
                  <Select
                    value={member.gender}
                    onValueChange={(value) => onUpdateMember(index, 'gender', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nationality *</label>
                  <Input
                    className="mt-1"
                    placeholder="Ghanaian"
                    value={member.nationality}
                    onChange={(e) => onUpdateMember(index, 'nationality', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    className="mt-1"
                    placeholder="0201234567"
                    value={member.phone}
                    onChange={(e) => onUpdateMember(index, 'phone', e.target.value)}
                  />
                </div>
              </div>

              {/* KYC Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Occupation *</label>
                  <Input
                    className="mt-1"
                    placeholder="Trader, Farmer, etc."
                    value={member.occupation}
                    onChange={(e) => onUpdateMember(index, 'occupation', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Risk Category *</label>
                  <Select
                    value={member.risk_category}
                    onValueChange={(value) => onUpdateMember(index, 'risk_category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select risk" />
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
                    placeholder="Trading profits, Salary, etc."
                    value={member.source_of_funds}
                    onChange={(e) => onUpdateMember(index, 'source_of_funds', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { emptyMember };