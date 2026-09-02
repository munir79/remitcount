const COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

const getColorForName = (name = "") => {
  const index = name.charCodeAt(0) % COLORS.length;
  return COLORS[index] || COLORS[0];
};

const Avatar = ({ name, size = "sm" }) => {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full font-semibold ${getColorForName(name)}`}>
      {initial}
    </div>
  );
};

export default Avatar;