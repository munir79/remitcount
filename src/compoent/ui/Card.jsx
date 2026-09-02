const Card = ({ children, className = "" }) => {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-200/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;