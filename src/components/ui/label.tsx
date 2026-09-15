import { Label as LabelPrimitive } from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive>) {
  return (
    <LabelPrimitive
      className={cn(
        "font-serif text-sm font-medium tracking-[0.18em] text-sage uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
