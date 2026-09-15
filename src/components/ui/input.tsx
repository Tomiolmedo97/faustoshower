import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-md bg-paper-deep px-4 font-serif text-lg text-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-sage)_22%,transparent)] transition-[box-shadow] duration-(--motion-quick) placeholder:text-muted/70 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-sage)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
