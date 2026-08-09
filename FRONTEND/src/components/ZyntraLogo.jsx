export function ZyntraIcon({ size = 32, className = "text-[#0F172A]" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(50,50)">
        <ellipse
          rx="33"
          ry="17"
          transform="rotate(45)"
          stroke="currentColor"
          strokeWidth="9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          rx="33"
          ry="17"
          transform="rotate(-45)"
          stroke="currentColor"
          strokeWidth="9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function ZyntraLogo({ size = 30, variant = "light", className = "" }) {
  const iconColor = variant === "light" ? "text-white" : "text-[#0F172A]";
  const textColor = variant === "light" ? "text-white" : "text-[#0F172A]";
  const aiColor   = variant === "light" ? "text-white" : "text-[#0F172A]";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ZyntraIcon size={size} className={iconColor} />
      <div className="flex items-baseline gap-1.5 select-none font-heading leading-none">
        <span className={`text-[20px] font-black tracking-tight ${textColor} uppercase`}>
          ZYNTRA
        </span>
        <span className={`text-[20px] font-black tracking-tight ${aiColor} uppercase`}>
          AI
        </span>
      </div>
    </div>
  );
}
