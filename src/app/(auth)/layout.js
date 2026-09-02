const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold text-neutral-900">AccountSaaS</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;