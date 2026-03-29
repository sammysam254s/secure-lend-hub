import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-foreground text-background py-6 mt-auto">
    <div className="container mx-auto px-4 text-center text-sm">
      <div className="flex flex-wrap justify-center gap-4 mb-3 opacity-90">
        <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
        <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
        <a href="mailto:support@securelend.online" className="hover:underline">Contact Us</a>
      </div>
      <p className="opacity-70">© {new Date().getFullYear()} P2P Secure-Lend Kenya. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
