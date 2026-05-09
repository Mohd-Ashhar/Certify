export default function BrandShield({ size = 28, strokeWidth = 1.5, className }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 64) / 56)}
      viewBox="0 0 56 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M28 2L4 13V32C4 46 14.5 57.5 28 62C41.5 57.5 52 46 52 32V13L28 2Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M28 8L10 17V32C10 43 17.5 52 28 56C38.5 52 46 43 46 32V17L28 8Z"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path
        d="M18 32L24.5 38.5L38 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
