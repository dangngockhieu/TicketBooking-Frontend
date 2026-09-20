import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-focus)] focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary rounded-pill hover:bg-primary-focus",
        secondary: "bg-canvas text-primary rounded-pill border border-hairline hover:bg-canvas-parchment",
        dark: "bg-ink text-body-on-dark rounded-sm hover:opacity-90",
        ghost: "text-ink hover:bg-canvas-parchment rounded-sm",
        danger: "bg-danger text-on-primary rounded-pill hover:opacity-90",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** Dùng khi cần class giống Button nhưng trên một element khác (vd AlertDialogAction). */
export function buttonLikeClass(variant: VariantProps<typeof buttonVariants>["variant"] = "primary") {
  return buttonVariants({ variant });
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
