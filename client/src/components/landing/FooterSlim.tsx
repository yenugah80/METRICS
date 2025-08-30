export default function FooterSlim() {
  return (
    <footer className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-t border-slate-200/50">
      {/* Trust & Database Section */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-12 mb-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-3">
            Track 20M+ Global Foods with 99% Accuracy
          </h3>
          <p className="text-lg opacity-90 mb-6">
            Powered by USDA, OpenFoodFacts, and verified nutritionist data
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Lab-Tested Precision</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span>Global Recognition</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              MyFoodMatrics
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Revolutionary AI-powered nutrition intelligence for real life. Track meals through photos, voice, and barcodes with personalized health insights.
            </p>
            <a 
              href="#get-started" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              data-testid="button-footer-start"
            >
              <span>Start Free Today</span>
              <span className="text-sm">→</span>
            </a>
          </div>

          {/* Features */}
          <nav>
            <div className="font-bold text-slate-900 mb-4">Features</div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Photo Analysis</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Voice Logging</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Barcode Scanner</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">AI Chef Recipes</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Health Scoring</a></li>
            </ul>
          </nav>

          {/* Resources */}
          <nav>
            <div className="font-bold text-slate-900 mb-4">Resources</div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Nutrition Guide</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
            </ul>
          </nav>

          {/* Company */}
          <nav>
            <div className="font-bold text-slate-900 mb-4">Company</div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Press Kit</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Partners</a></li>
            </ul>
          </nav>
        </div>

        {/* Social & Legal */}
        <div className="border-t border-slate-200/70 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} MyFoodMatrics, Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">GDPR</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}