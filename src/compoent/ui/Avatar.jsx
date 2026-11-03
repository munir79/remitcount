const COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

const SIZES = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };

const getColorForName = (name = "") => {
  const index = name.charCodeAt(0) % COLORS.length;
  return COLORS[index] || COLORS[0];
};

// "Jakir Hossain" → "JH"
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

const Avatar = ({ name, size = "sm", className = "" }) => {
  return (
    <div
      className={`flex ${SIZES[size] || SIZES.sm} shrink-0 items-center justify-center rounded-full font-semibold ${getColorForName(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
