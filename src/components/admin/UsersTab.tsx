import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Ban, Trash2, UserCheck, Loader2 } from 'lucide-react';
import { formatKES, getStatusColor } from '@/lib/formatters';
import { toast } from 'sonner';

interface UsersTabProps {
  users: any[];
  onRefresh: () => void;
}

const UsersTab = ({ users, onRefresh }: UsersTabProps) => {
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', phone_number: '', national_id: '', role: 'lender', first_name: '', last_name: '', password: '' });

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.phone_number || !newUser.national_id || !newUser.password) {
      toast.error('Please fill all required fields including password');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setAdding(true);
    try {
      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          username: newUser.username,
          phone_number: newUser.phone_number,
          national_id: newUser.national_id,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
        },
      });

      if (response.error) {
        toast.error(response.error.message || 'Failed to create user');
      } else if (response.data?.error) {
        toast.error(response.data.error);
      } else {
        toast.success(`${newUser.role} added successfully with login credentials`);
        setAddOpen(false);
        setNewUser({ username: '', email: '', phone_number: '', national_id: '', role: 'lender', first_name: '', last_name: '', password: '' });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  const handleSuspend = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId);
    if (error) toast.error(error.message);
    else {
      toast.success(currentStatus ? 'User suspended' : 'User reactivated');
      onRefresh();
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (email === 'sammyseth260@gmail.com') {
      toast.error('Cannot delete the admin user');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) toast.error(error.message);
    else {
      toast.success('User deleted');
      onRefresh();
    }
  };

  return (
    <Card className="border-0 shadow-sm mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-lg">All Users ({users.length})</CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs sm:text-sm"><UserPlus className="h-4 w-4 mr-1" /> Add User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">First Name</Label><Input className="h-9" value={newUser.first_name} onChange={e => setNewUser(p => ({ ...p, first_name: e.target.value }))} /></div>
                <div><Label className="text-xs">Last Name</Label><Input className="h-9" value={newUser.last_name} onChange={e => setNewUser(p => ({ ...p, last_name: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Username *</Label><Input className="h-9" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} /></div>
              <div><Label className="text-xs">Email *</Label><Input className="h-9" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Password *</Label><Input className="h-9" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" /></div>
              <div><Label className="text-xs">Phone *</Label><Input className="h-9" value={newUser.phone_number} onChange={e => setNewUser(p => ({ ...p, phone_number: e.target.value }))} /></div>
              <div><Label className="text-xs">National ID *</Label><Input className="h-9" value={newUser.national_id} onChange={e => setNewUser(p => ({ ...p, national_id: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lender">Lender</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="borrower">Borrower</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAddUser} disabled={adding}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {adding ? 'Creating User...' : 'Add User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="text-sm font-medium">
                  {u.username}
                  <span className="block sm:hidden text-xs text-muted-foreground truncate max-w-[120px]">{u.email}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{u.email}</TableCell>
                <TableCell><Badge className={`${getStatusColor(u.role === 'admin' ? 'listed' : 'active')} text-xs`}>{u.role}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-sm">{formatKES(Number(u.wallet_balance || 0))}</TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? 'default' : 'destructive'} className="text-xs">
                    {u.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.email !== 'sammyseth260@gmail.com' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleSuspend(u.id, u.is_active)}>
                        {u.is_active ? <Ban className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDelete(u.id, u.email)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UsersTab;
