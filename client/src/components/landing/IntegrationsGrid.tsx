const logos = ["fitbit","apple","garmin","strava","withings","healthconnect","oura","mapmyrun","samsung","polar"];

export default function IntegrationsGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="rounded-3xl p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center relative overflow-hidden" style={{
        background: 'var(--gradient-light-glossy)',
        boxShadow: 'var(--glow-light-glossy)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.6)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at top left, rgba(200, 230, 255, 0.2) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(160, 220, 255, 0.15) 0%, transparent 50%)'
        }}></div>
        <div className="relative z-10">
          <div className="text-sm/6 font-semibold" style={{ color: 'hsl(210, 60%, 50%)', opacity: 0.8 }}>35+ apps and devices</div>
          <h3 className="mt-1 text-3xl font-extrabold" style={{ 
            background: 'linear-gradient(135deg, hsl(220, 100%, 30%) 0%, hsl(200, 90%, 40%) 50%, hsl(180, 80%, 45%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Sync steps, weight, workouts & more</h3>
        </div>
        <div className="grid grid-cols-5 gap-3 md:gap-4 relative z-10">
          {logos.map(l => (
            <div key={l} className="aspect-square rounded-xl grid place-items-center text-xs uppercase font-bold transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 248, 255, 0.6) 100%)',
              color: 'hsl(210, 80%, 40%)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(200, 220, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}>{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
}