import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border-2 text-sm font-bold tracking-[0.02em] outline-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "island-press border-[#f8f8f0] bg-[#f8f8f0] text-[#794f27]",
        secondary:
          "island-press border-primary bg-primary text-white shadow-[0_5px_0_0_#11a89b] hover:bg-[#3dd4c6] hover:shadow-[0_6px_0_0_#11a89b] active:shadow-[0_1px_0_0_#11a89b]",
        outline:
          "island-press border-border bg-card text-card-foreground hover:border-primary hover:text-primary",
        ghost:
          "border-transparent bg-transparent text-card-foreground shadow-none hover:bg-secondary",
      },
      size: {
        default: "h-[45px] rounded-full px-5",
        sm: "h-8 rounded-2xl px-4 text-xs",
        lg: "h-12 rounded-3xl px-8 text-base",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
