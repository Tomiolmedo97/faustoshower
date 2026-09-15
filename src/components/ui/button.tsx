import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-serif text-base font-medium tracking-wide transition-[background-color,color,box-shadow,transform,border-color] duration-(--motion-quick) ease-(--ease-out) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary:
          "bg-sage text-paper shadow-[0_1px_0_color-mix(in_oklab,var(--color-ink)_8%,transparent)] hover:bg-sage-deep",
        outline:
          "bg-transparent text-sage ring-1 ring-inset ring-sage/35 hover:bg-sage/10 hover:ring-sage/55",
        ghost: "bg-transparent text-sage hover:bg-sage/10",
        brown: "bg-brown text-paper hover:bg-brown/90",
      },
      size: {
        md: "h-12 rounded-md px-6",
        lg: "h-12 rounded-lg px-8",
        icon: "size-12 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
