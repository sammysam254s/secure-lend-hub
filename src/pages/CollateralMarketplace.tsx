import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Trash2, CreditCard, Package, Tag } from 'lucide-react';
import { formatKES } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const CollateralMarketplace = () => {
  const { profile, refreshProfile } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchData = async () => {
    const { data: salesData } = await supabase
      .from('collateral_sales')
      .select(`
        *,
        collateral(item_type, brand_model, market_value, agent_verified_value, collateral_code),
        loans(principal_amount, duration_months, borrower_id),
        buyer:users!collateral_sales_buyer_id_fkey(username)
      `)
      .eq('status', 'listed')
      .order('created_at', { ascending: false });

    setSales(salesData || []);

    if (profile) {
      const { data: cart } = await supabase
        .from('cart_items')
        .select(`
          *,
          collateral_sales(
            *,
            collateral(item_type, brand_model, agent_verified_value, collateral_code)
          )
        `)
        .eq('user_id', profile.id);
      setCartItems(cart || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const addToCart = async (saleId: string) => {
    if (!profile) { toast.error('Please login to add items to cart'); return; }
    setActionLoading(saleId);
    const { error } = await supabase.from('cart_items').insert({
      user_id: profile.id,
      collateral_sale_id: saleId,
    });
    if (error) {
      if (error.code === '23505') toast.info('Already in your cart');
      else toast.error(error.message);
    } else {
      toast.success('Added to cart!');
    }
    await fetchData();
    setActionLoading(null);
  };

  const removeFromCart = async (cartItemId: string) => {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    toast.success('Removed from cart');
    fetchData();
  };

  const cartTotal = cartItems.reduce((sum, ci) => sum + Number(ci.collateral_sales?.sale_price || 0), 0);
  const isInCart = (saleId: string) => cartItems.some(ci => ci.collateral_sale_id === saleId);

  const handleCheckout = async () => {
    if (!profile || cartItems.length === 0) return;
    setCheckingOut(true);

    const walletBalance = Number(profile.wallet_balance || 0);
    if (walletBalance < cartTotal) {
      toast.error(`Insufficient balance. Need ${formatKES(cartTotal)}, have ${formatKES(walletBalance)}`);
      setCheckingOut(false);
      return;
    }

    let newBalance = walletBalance;

    for (const ci of cartItems) {
      const sale = ci.collateral_sales;
      if (!sale) continue;

      const price = Number(sale.sale_price);
      newBalance -= price;

      // Update sale as purchased
      await supabase.from('collateral_sales').update({
        status: 'sold',
        buyer_id: profile.id,
        purchased_at: new Date().toISOString(),
      }).eq('id', sale.id);

      // Mark collateral as sold
      await supabase.from('collateral').update({ status: 'sold' }).eq('id', sale.collateral_id);

      // Log buyer transaction
      await supabase.from('wallet_transactions').insert({
        user_id: profile.id,
        transaction_type: 'withdrawal',
        amount: price,
        balance_after: newBalance,
        description: `Purchased collateral ${sale.collateral?.collateral_code || sale.collateral_id}`,
      });

      // Credit the platform (sale proceeds go to cover defaulted loan)
      // The proceeds could go to lenders — for now logged as platform revenue
    }

    // Deduct from buyer wallet
    await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', profile.id);

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', profile.id);

    await refreshProfile();
    await fetchData();
    toast.success('Purchase complete! You can collect your items from the agent.');
    setCheckingOut(false);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Collateral Marketplace</h1>
            <p className="text-muted-foreground text-sm">Browse and purchase collateral from defaulted loans</p>
          </div>

          {profile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Cart
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Shopping Cart ({cartItems.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 flex-1 overflow-auto">
                  {cartItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Your cart is empty</p>
                  ) : (
                    <>
                      {cartItems.map(ci => {
                        const sale = ci.collateral_sales;
                        const coll = sale?.collateral;
                        return (
                          <Card key={ci.id} className="border shadow-none">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{coll?.item_type} - {coll?.brand_model}</p>
                                <p className="text-xs font-mono text-muted-foreground">{coll?.collateral_code}</p>
                                <p className="text-sm font-bold text-primary">{formatKES(Number(sale?.sale_price || 0))}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeFromCart(ci.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                      <hr />
                      <div className="flex justify-between items-center text-sm font-semibold px-1">
                        <span>Total</span>
                        <span className="text-primary">{formatKES(cartTotal)}</span>
                      </div>
                      {profile && (
                        <p className="text-xs text-muted-foreground px-1">
                          Wallet balance: {formatKES(Number(profile.wallet_balance || 0))}
                        </p>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="w-full" disabled={checkingOut}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Checkout ({formatKES(cartTotal)})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                            <AlertDialogDescription>
                              You are about to purchase {cartItems.length} item(s) for {formatKES(cartTotal)} from your wallet.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCheckout}>
                              {checkingOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Confirm Payment
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {sales.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No collateral items available for sale at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sales.map(sale => {
              const coll = sale.collateral;
              const inCart = isInCart(sale.id);
              const isLoading = actionLoading === sale.id;
              return (
                <Card key={sale.id} className="border-0 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">{coll?.item_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{coll?.brand_model}</p>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{coll?.collateral_code}</span>
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Defaulted Loan</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Appraised Value</p>
                        <p className="font-medium">{formatKES(Number(coll?.agent_verified_value || coll?.market_value || 0))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Original Loan</p>
                        <p className="font-medium">{formatKES(Number(sale.loans?.principal_amount || 0))}</p>
                      </div>
                    </div>

                    <div className="rounded-md bg-primary/5 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Sale Price</p>
                      <p className="text-xl font-bold text-primary flex items-center justify-center gap-1">
                        <Tag className="h-4 w-4" />
                        {formatKES(Number(sale.sale_price))}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    {inCart ? (
                      <Button variant="secondary" className="w-full" disabled>
                        <ShoppingCart className="h-4 w-4 mr-1" /> In Cart
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => addToCart(sale.id)} disabled={isLoading || !profile}>
                        {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-1" />}
                        Add to Cart
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CollateralMarketplace;
