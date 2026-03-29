import Layout from '@/components/Layout';

const Privacy = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p className="text-foreground font-medium">Last updated: March 2026</p>
        <p>P2P Secure-Lend Kenya ("we", "our", "the Platform") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>

        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <p>We collect personal information including: full name, email address, phone number, National ID number, date of birth, ID document images, selfie photos, and digital signatures during KYC verification.</p>

        <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
        <p>Your information is used for: account creation, KYC verification, loan processing, contract generation, fraud prevention, and communication about your account and services.</p>

        <h2 className="text-lg font-semibold text-foreground">3. Data Storage & Security</h2>
        <p>All personal data is stored securely using industry-standard encryption. KYC documents are stored in secure cloud storage with restricted access.</p>

        <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
        <p>We do not sell your personal data. Information may be shared with: verified agents for collateral verification, lenders (limited contract details), and law enforcement when legally required.</p>

        <h2 className="text-lg font-semibold text-foreground">5. Financial Data</h2>
        <p>Transaction history, wallet balances, and loan details are stored securely and accessible only to you and authorized Platform administrators.</p>

        <h2 className="text-lg font-semibold text-foreground">6. Cookies & Analytics</h2>
        <p>We use essential cookies for authentication and session management. Analytics data is collected anonymously to improve the Platform's performance.</p>

        <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
        <p>You have the right to: access your personal data, request corrections, request deletion (subject to legal obligations), and withdraw consent for optional data processing.</p>

        <h2 className="text-lg font-semibold text-foreground">8. Data Retention</h2>
        <p>We retain your data for as long as your account is active and for a minimum of 7 years after account closure, as required by Kenyan financial regulations.</p>

        <h2 className="text-lg font-semibold text-foreground">9. Children's Privacy</h2>
        <p>The Platform is not intended for individuals under 18. We do not knowingly collect data from minors.</p>

        <h2 className="text-lg font-semibold text-foreground">10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy periodically. Users will be notified of material changes via email or in-app notification.</p>

        <h2 className="text-lg font-semibold text-foreground">11. Contact Us</h2>
        <p>For privacy-related inquiries, contact our Data Protection Officer at privacy@securelend.online.</p>
      </div>
    </div>
  </Layout>
);

export default Privacy;
