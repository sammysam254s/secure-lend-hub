import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { Shield, TrendingUp, Zap, ArrowRight, Leaf, Users, FileCheck, Wallet } from 'lucide-react';

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4 md:text-5xl">P2P Secure-Lend Kenya</h1>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Kenya's trusted peer-to-peer lending platform. Borrow against your assets or earn 13% monthly returns as a lender.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" className="bg-white text-primary font-semibold hover:bg-white/90" asChild>
              <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white/20 font-semibold" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Why Choose Us</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: 'Secured Lending', desc: 'All loans are backed by verified physical collateral, protecting both borrowers and lenders.' },
              { icon: TrendingUp, title: 'High Returns', desc: 'Lenders earn 13% monthly interest on their investments with transparent terms.' },
              { icon: Zap, title: 'Quick Process', desc: 'Fast collateral verification, quick loan listing, and seamless funding process.' },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-sm text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-primary">For Borrowers</h3>
              <div className="space-y-4">
                {[
                  { step: '1', icon: Users, text: 'Register and complete KYC verification' },
                  { step: '2', icon: FileCheck, text: 'Submit your collateral for agent verification' },
                  { step: '3', icon: Wallet, text: 'Apply for a loan and get funded by lenders' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{s.step}</div>
                    <div className="flex items-center gap-3 pt-2">
                      <s.icon className="h-5 w-5 text-primary shrink-0" />
                      <p>{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6 text-primary">For Lenders</h3>
              <div className="space-y-4">
                {[
                  { step: '1', icon: Users, text: 'Register and browse the loan marketplace' },
                  { step: '2', icon: Shield, text: 'Review collateral-backed loan opportunities' },
                  { step: '3', icon: TrendingUp, text: 'Invest and earn 13% monthly returns' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{s.step}</div>
                    <div className="flex items-center gap-3 pt-2">
                      <s.icon className="h-5 w-5 text-primary shrink-0" />
                      <p>{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="mb-8 opacity-90 max-w-xl mx-auto">Join thousands of Kenyans using P2P Secure-Lend for secured borrowing and high-return lending.</p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
