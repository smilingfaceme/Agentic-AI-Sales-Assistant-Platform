export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-white pt-10 pb-4 border-t border-gray-700">
      <div className="w-[70vw] max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-8 pb-8">
        {/* Branding */}
        <div>
          <span className="text-2xl font-bold">DoshiAI</span>
          <p className="mt-2 text-sm text-gray-400">Empowering your workflow with advanced AI solutions.</p>
        </div>
        {/* Product Links */}
        <div>
          <h4 className="font-semibold mb-2">Product</h4>
          <ul className="space-y-1 text-gray-400">
            <li><a href="#" className="hover:text-white">Features</a></li>
            <li><a href="#" className="hover:text-white">Pricing</a></li>
            <li><a href="#" className="hover:text-white">Demo</a></li>
          </ul>
        </div>
        {/* Company Links */}
        <div>
          <h4 className="font-semibold mb-2">Company</h4>
          <ul className="space-y-1 text-gray-400">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
          </ul>
        </div>
        {/* Support Links */}
        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="space-y-1 text-gray-400">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-4 text-center text-gray-400 text-sm">
        &copy; 2025 DoshiAI. All rights reserved.
      </div>
    </footer>
  );
}
