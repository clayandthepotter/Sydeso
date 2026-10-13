/** The Sydeso mark. Fills with currentColor so it takes the colour of its context. */
export function Mark({ size = 24, className }: { size?: number; className?: string }) {
  const width = Math.round(((size * 114.25) / 130.78) * 100) / 100;
  return (
    <svg
      className={className}
      viewBox="0 0 114.25 130.78"
      width={width}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M44.18,122.57l9.61-5.33,47.46-27.04-.07-18.91-20.26-11.97-19.05,10.84-28.79,16.69L.24,67.58c-.33-3.11-.3-5.67.13-8.52l-.17-12.72-.21-13.74L56.77,0l12.78,7.65c-.46,1.03-1.45,1.53-2.49,2.12l-32.44,18.46-21.6,12.55-.03,18.86,20.01,11.54,47.97-27.41,33.2,19.62.08,34.83-56.88,32.57-13.19-8.21Z" />
      <path d="M113.4,48.38l-31.43-18.45-43.15,24.89-13.09-7.8,31.87-18.53,24.66-14.03,31.93,18.7.04,11.84-.83,3.38Z" />
      <path d="M32.18,116.05L.4,97.18l.07-15.18,31.97,18.62,42.69-24.87,13.73,8.13-8.65,4.69-48.03,27.48Z" />
    </svg>
  );
}
