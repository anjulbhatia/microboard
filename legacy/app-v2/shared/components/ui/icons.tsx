import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckIcon as CheckIconData,
  ChevronDownIcon as ChevronDownIconData,
  ChevronUpIcon as ChevronUpIconData,
} from "@hugeicons/core-free-icons";

function make(data: typeof CheckIconData) {
  return function Icon({ className }: { className?: string }) {
    return <HugeiconsIcon icon={data} strokeWidth={1.5} className={className} />;
  };
}

export const CheckIcon = make(CheckIconData);
export const ChevronDownIcon = make(ChevronDownIconData);
export const ChevronUpIcon = make(ChevronUpIconData);
export const XIcon = make(Cancel01Icon);
