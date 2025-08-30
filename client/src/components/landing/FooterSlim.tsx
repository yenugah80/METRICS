export default function FooterSlim() {
  return (
    <footer className="bg-zinc-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 grid md:grid-cols-4 gap-8">
        <div>
          <div className="text-xl font-bold">myfoodmatrics</div>
          <p className="mt-2 text-sm/6 text-white/70">Nutrition tracking for real life.</p>
          <a href="#get-started" className="mt-4 inline-block rounded-full bg-white text-zinc-900 px-5 py-2 font-semibold">Start today</a>
        </div>
        <nav>
          <div className="font-semibold">Products</div>
          <ul className="mt-2 space-y-1 text-sm/6 text-white/80">
            <li><a href="#">Exercise</a></li>
            <li><a href="#">Apps</a></li>
            <li><a href="#">Premium</a></li>
          </ul>
        </nav>
        <nav>
          <div className="font-semibold">Resources</div>
          <ul className="mt-2 space-y-1 text-sm/6 text-white/80">
            <li><a href="#">Blog</a></li>
            <li><a href="#">Community</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </nav>
        <nav>
          <div className="font-semibold">Company</div>
          <ul className="mt-2 space-y-1 text-sm/6 text-white/80">
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-white/70">
          © {new Date().getFullYear()} MyFoodMatrics, Inc. • Privacy • Terms
        </div>
      </div>
    </footer>
  );
}