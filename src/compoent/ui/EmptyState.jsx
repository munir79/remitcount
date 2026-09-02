import { Inbox } from "lucide-react";

const EmptyState = ({ icon: Icon = Inbox, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-3 h-10 w-10 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {description && <p className="mt-1 text-xs text-neutral-400">{description}</p>}
    </div>
  );
};

export default EmptyState;