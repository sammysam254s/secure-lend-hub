import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Leaf, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'borrower': return '/borrower';
      case 'lender': return '/marketplace';
      case 'agent': return '/agent';
      case 'admin': return '/admin-dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Leaf className="h-6 w-6" />
          <span className="hidden sm:inline">P2P Secure-Lend Kenya</span>
          <span className="sm:hidden">P2P Lend</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {user && profile ? (
            <>
              <Link to={getDashboardLink()} className="hover:underline">Dashboard</Link>
              {profile.role === 'admin' && (
                <>
                  <Link to="/borrower" className="hover:underline text-sm opacity-90">Borrower</Link>
                  <Link to="/marketplace" className="hover:underline text-sm opacity-90">Lender</Link>
                  <Link to="/agent" className="hover:underline text-sm opacity-90">Agent</Link>
                </>
              )}
              <Link to="/wallet" className="hover:underline">Wallet</Link>
              <Link to="/contracts" className="hover:underline">Contracts</Link>
              <span className="text-sm opacity-80">
                {profile.username} ({profile.role})
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary-foreground/20 bg-primary px-4 py-3 space-y-2">
          {user && profile ? (
            <>
              <Link to={getDashboardLink()} className="block py-1 hover:underline" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              {profile.role === 'admin' && (
                <>
                  <Link to="/borrower" className="block py-1 hover:underline text-sm opacity-90" onClick={() => setMobileOpen(false)}>Borrower View</Link>
                  <Link to="/marketplace" className="block py-1 hover:underline text-sm opacity-90" onClick={() => setMobileOpen(false)}>Lender View</Link>
                  <Link to="/agent" className="block py-1 hover:underline text-sm opacity-90" onClick={() => setMobileOpen(false)}>Agent View</Link>
                </>
              )}
              <Link to="/wallet" className="block py-1 hover:underline" onClick={() => setMobileOpen(false)}>Wallet</Link>
              <Link to="/contracts" className="block py-1 hover:underline" onClick={() => setMobileOpen(false)}>Contracts</Link>
              <div className="text-sm opacity-80 py-1">{profile.username} ({profile.role})</div>
              <Button variant="secondary" size="sm" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" asChild><Link to="/login">Login</Link></Button>
              <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground" asChild><Link to="/register">Register</Link></Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
