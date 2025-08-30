import { useState } from "react";

const faqs = [
  { q: "Is MyFoodMatrics free?", a: "Yes—try core logging and analysis free. Premium unlocks unlimited analysis and advanced rules." },
  { q: "What can I track besides calories?", a: "Allergens, diet compatibility, macronutrients, key micros, and eco impact." },
  { q: "Do I need an API key?", a: "No. Local demo works without a key. Enable AI later with one toggle." },
  { q: "How accurate is the food recognition?", a: "Our AI achieves 99% accuracy using advanced computer vision and machine learning trained on millions of food images." },
  { q: "Does it work for global cuisines?", a: "Yes! Our chef AI is trained on cuisines from around the world, providing accurate analysis for international dishes." },
  { q: "Can it detect allergies in my food?", a: "Absolutely. We detect all major allergens and provide instant safety alerts based on your personal allergy profile." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h3 className="text-center text-3xl font-extrabold">Q&A</h3>
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-2xl border">
            <button 
              className="w-full text-left p-5 font-medium flex items-center justify-between" 
              onClick={() => setOpen(open===i ? null : i)}
              data-testid={`faq-question-${i}`}
            >
              {f.q} <span>{open===i ? "–" : "+"}</span>
            </button>
            {open===i && <div className="px-5 pb-5 text-gray-600">{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}