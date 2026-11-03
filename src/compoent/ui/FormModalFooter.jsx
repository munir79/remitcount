import { CornerDownLeft } from "lucide-react";
import Button from "./Button";

/**
 * ✅ Modal এর নিচের Bar — বামে Keyboard Tip, ডানে Cancel + Submit
 * formId দিয়ে Footer এর Button টা Form এর বাইরে থেকেও Submit করতে পারে
 */
const FormModalFooter = ({ formId, onCancel, isLoading, submitLabel = "Save as Draft", showEnterHint = true }) => (
  <div className="flex w-full items-center justify-between gap-3">
    {showEnterHint ? (
      <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
        <kbd className="inline-flex h-5 items-center rounded border border-slate-300 bg-white px-1.5 font-sans text-[11px] text-slate-600 shadow-sm">
          <CornerDownLeft className="h-3 w-3" />
        </kbd>
        next field
      </p>
    ) : (
      <span />
    )}
    <div className="flex gap-2.5">
      <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
      <Button type="submit" form={formId} isLoading={isLoading}>
        {submitLabel}
      </Button>
    </div>
  </div>
);

export default FormModalFooter;
