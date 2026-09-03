const COLORS = [
  "bg-indigo-100 text-indigo-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
];

const getColorForName = (name = "") => {
  const index = name.charCodeAt(0) % COLORS.length;
  return COLORS[index] || COLORS[0];
};

const Avatar = ({ name, size = "sm" }) => {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full font-bold ${getColorForName(name)}`}>
      {initial}
    </div>
  );
};

export default Avatar;