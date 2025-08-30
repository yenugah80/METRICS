const logos = ["fitbit","apple","garmin","strava","withings","healthconnect","oura","mapmyrun","samsung","polar"];

export default function IntegrationsGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="rounded-3xl bg-zinc-900 text-white p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="text-sm/6 opacity-70">35+ apps and devices</div>
          <h3 className="mt-1 text-3xl font-extrabold">Sync steps, weight, workouts & more</h3>
        </div>
        <div className="grid grid-cols-5 gap-3 md:gap-4">
          {logos.map(l => (
            <div key={l} className="aspect-square rounded-xl bg-white/10 grid place-items-center text-xs uppercase">{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
}