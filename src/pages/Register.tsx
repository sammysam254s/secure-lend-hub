import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Leaf, Loader2 } from 'lucide-react';

const Register = () => {
  const [form, setForm] = useState({
    email: '', password: '', username: '', phone_number: '', national_id: '', role: '', first_name: '', last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) { setError(authError.message); setLoading(false); return; }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          auth_user_id: authData.user.id,
          email: form.email,
          username: form.username,
          phone_number: form.phone_number,
          national_id: form.national_id,
          role: form.role,
          first_name: form.first_name,
          last_name: form.last_name,
        });

        if (profileError) { setError(profileError.message); setLoading(false); return; }
      }

      navigate('/login');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join P2P Secure-Lend Kenya today</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={e => handleChange('username', e.target.value)} placeholder="johndoe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="john@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={form.phone_number} onChange={e => handleChange('phone_number', e.target.value)} placeholder="+254700000000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_id">National ID Number</Label>
              <Input id="national_id" value={form.national_id} onChange={e => handleChange('national_id', e.target.value)} placeholder="12345678" required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => handleChange('role', v)}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrower">Borrower</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !form.role}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
