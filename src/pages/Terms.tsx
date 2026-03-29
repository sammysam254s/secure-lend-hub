import Layout from '@/components/Layout';

const Terms = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Terms & Conditions</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p className="text-foreground font-medium">Last updated: March 2026</p>
        <p>By accessing and using P2P Secure-Lend Kenya ("the Platform"), you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.</p>

        <h2 className="text-lg font-semibold text-foreground">1. Definitions</h2>
        <p>"Platform" refers to P2P Secure-Lend Kenya and all associated services. "User" refers to any person who registers and uses the Platform, including borrowers, lenders, and agents.</p>

        <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
        <p>You must be at least 18 years old and a Kenyan citizen or resident with a valid National ID to use this Platform.</p>

        <h2 className="text-lg font-semibold text-foreground">3. Account Registration</h2>
        <p>Users must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials.</p>

        <h2 className="text-lg font-semibold text-foreground">4. KYC Verification</h2>
        <p>All users must complete Know Your Customer (KYC) verification before accessing financial services. This includes submitting valid identification documents.</p>

        <h2 className="text-lg font-semibold text-foreground">5. Loan Applications</h2>
        <p>Borrowers may apply for loans by submitting collateral. Loan amounts are determined based on agent-verified collateral values using the 30/50 rule (30% devaluation, then 50% of devalued value).</p>

        <h2 className="text-lg font-semibold text-foreground">6. Interest Rates</h2>
        <p>Loans carry a flat monthly interest rate of 13%. The total repayment includes principal, interest, platform fees, and insurance fees.</p>

        <h2 className="text-lg font-semibold text-foreground">7. Platform Fees</h2>
        <p>A 2% platform fee is charged on the principal amount for borrowers at disbursement. Lenders are charged a 2% platform fee on interest earned upon repayment.</p>

        <h2 className="text-lg font-semibold text-foreground">8. Insurance Fee</h2>
        <p>A 1% insurance fee is charged on the principal amount for both borrowers (at disbursement) and lenders (at repayment). This fee contributes to the insurance pool for default protection.</p>

        <h2 className="text-lg font-semibold text-foreground">9. Collateral Requirements</h2>
        <p>All loans must be backed by physical collateral. Collateral must be verified by an authorized agent before the loan can be listed on the marketplace.</p>

        <h2 className="text-lg font-semibold text-foreground">10. Agent Responsibilities</h2>
        <p>Agents are responsible for physically verifying collateral and providing accurate market valuations. Agents earn commissions on verified loans.</p>

        <h2 className="text-lg font-semibold text-foreground">11. Lender Responsibilities</h2>
        <p>Lenders invest at their own risk. While collateral-backed loans reduce risk, the Platform does not guarantee returns. Lenders should diversify their investments.</p>

        <h2 className="text-lg font-semibold text-foreground">12. Loan Repayment</h2>
        <p>Borrowers must repay loans in full by the due date. Failure to repay may result in collateral seizure and legal action.</p>

        <h2 className="text-lg font-semibold text-foreground">13. Default & Recovery</h2>
        <p>In case of default, the Platform reserves the right to liquidate the borrower's collateral to recover funds for lenders.</p>

        <h2 className="text-lg font-semibold text-foreground">14. Wallet Services</h2>
        <p>Users can deposit and withdraw funds through their Platform wallet. All transactions are recorded and visible in the transaction history.</p>

        <h2 className="text-lg font-semibold text-foreground">15. Contract Generation</h2>
        <p>Once a loan is fully funded, a legally binding contract is generated. All parties are bound by the terms specified in the contract.</p>

        <h2 className="text-lg font-semibold text-foreground">16. QR Code Verification</h2>
        <p>Each contract includes a QR code for authenticity verification. Scanning the QR code confirms the contract's validity on the Platform.</p>

        <h2 className="text-lg font-semibold text-foreground">17. Privacy & Data Protection</h2>
        <p>We collect and process personal data in accordance with our Privacy Policy and applicable Kenyan data protection laws.</p>

        <h2 className="text-lg font-semibold text-foreground">18. Prohibited Activities</h2>
        <p>Users must not engage in fraud, money laundering, identity theft, or any illegal activities on the Platform. Violations will result in immediate account suspension.</p>

        <h2 className="text-lg font-semibold text-foreground">19. Account Suspension</h2>
        <p>The Platform reserves the right to suspend or terminate accounts that violate these terms or engage in suspicious activities.</p>

        <h2 className="text-lg font-semibold text-foreground">20. Dispute Resolution</h2>
        <p>Disputes between users shall first be resolved through the Platform's internal dispute resolution mechanism. Unresolved disputes may be escalated to arbitration under Kenyan law.</p>

        <h2 className="text-lg font-semibold text-foreground">21. Limitation of Liability</h2>
        <p>The Platform is not liable for losses arising from market fluctuations, borrower defaults (beyond the insurance pool), or circumstances beyond our control.</p>

        <h2 className="text-lg font-semibold text-foreground">22. Intellectual Property</h2>
        <p>All content, branding, and technology on the Platform are the intellectual property of P2P Secure-Lend Kenya. Unauthorized use is prohibited.</p>

        <h2 className="text-lg font-semibold text-foreground">23. Amendments</h2>
        <p>The Platform reserves the right to modify these terms at any time. Users will be notified of significant changes via email or in-app notification.</p>

        <h2 className="text-lg font-semibold text-foreground">24. Governing Law</h2>
        <p>These terms are governed by and construed in accordance with the laws of the Republic of Kenya.</p>

        <h2 className="text-lg font-semibold text-foreground">25. Contact Information</h2>
        <p>For questions or concerns regarding these terms, contact us at support@securelend.online or through the Platform's support channels.</p>
      </div>
    </div>
  </Layout>
);

export default Terms;
