import { useLocation } from "wouter";

export default function OnboardingCTA() {
  const [, navigate] = useLocation();

  return (
    <section id="get-started" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 to-blue-500" />
      <div className="mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center text-white">
        <div>
          <p className="uppercase text-xs/5 tracking-wider opacity-80">Get Started</p>
          <h3 className="text-4xl font-extrabold">Starting is the hard part. We make it easy.</h3>
          <p className="mt-3 opacity-90">Answer a few questions and we'll tailor your goals, diet rules, and swap preferences.</p>
          <div className="mt-6">
            <button 
              className="rounded-full bg-white text-blue-700 px-6 py-3 font-semibold shadow hover:opacity-95"
              onClick={() => navigate('/auth')}
              data-testid="button-onboarding-cta"
            >
              Take the quiz
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">🎯 Goal Selector Preview</div>
            <div className="space-y-3 text-sm">
              <div className="bg-white/20 rounded-lg p-3">Weight Management Goals</div>
              <div className="bg-white/20 rounded-lg p-3">Dietary Preferences Setup</div>
              <div className="bg-white/20 rounded-lg p-3">Health Condition Support</div>
              <div className="bg-white/20 rounded-lg p-3">Allergen Profile Creation</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}