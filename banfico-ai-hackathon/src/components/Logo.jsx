// A respectful nod to the Banfico mark: a navy disc with a teal crescent
// arc lifting out of it. Not the official asset — if the organizers hand
// you the real SVG, drop it in here and delete this.
export default function Logo({ size = 28, light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill={light ? '#FFFFFF' : '#0B2135'} />
        <path
          d="M20 4a16 16 0 1 0 0 32 11 11 0 0 1 0-22 8 8 0 0 0 0-10z"
          fill="#17A398"
        />
        <circle cx="20" cy="20" r="4.2" fill={light ? '#0B2135' : '#FFFFFF'} />
      </svg>
      <span
        className={`font-display text-[17px] font-semibold tracking-tight ${
          light ? 'text-white' : 'text-navy-900'
        }`}
       
      >
        Money<span className="text-teal-500">Sense</span>
      </span>
    </span>
  )
}
