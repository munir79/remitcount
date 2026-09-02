const SetupLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
};

export default SetupLayout;