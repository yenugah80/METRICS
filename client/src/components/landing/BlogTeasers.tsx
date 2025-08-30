const posts = [
  { title: "Essential Guide to Food Logging", blurb: "Accurate logs unlock better insights and swaps." },
  { title: "11 Things You'll Learn Using MyFoodMatrics", blurb: "From allergen safety to eco-lighter habits." },
  { title: "How AI Revolutionizes Nutrition Tracking", blurb: "Computer vision and ML techniques for precise food analysis." },
  { title: "Global Cuisine Intelligence", blurb: "Our chef AI understands traditional dishes from every culture." },
];

export default function BlogTeasers() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h3 className="text-3xl font-extrabold">From our experts</h3>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {posts.map(p => (
          <article key={p.title} className="rounded-2xl border overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
              <div className="text-4xl">🍽️</div>
            </div>
            <div className="p-5">
              <h4 className="text-lg font-semibold">{p.title}</h4>
              <p className="mt-1 text-gray-600 text-sm">{p.blurb}</p>
              <a className="mt-3 inline-block text-blue-700 font-medium" href="#">Read more →</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}