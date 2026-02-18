import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils";
import * as RadixSlider from "@radix-ui/react-slider";
import * as RadixSwitch from "@radix-ui/react-switch";
import * as RadixProgress from "@radix-ui/react-progress";

// --- Button ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "glass";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25",
      secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
      outline: "border border-slate-600 hover:bg-slate-800 text-slate-200",
      ghost: "hover:bg-slate-800/50 text-slate-300 hover:text-white",
      glass: "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white shadow-xl",
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-6 text-lg",
      icon: "h-10 w-10 p-2",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// --- Card ---
export const Card = ({ className, children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-xl font-semibold leading-none tracking-tight text-white", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

// --- Inputs ---
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:bg-slate-900",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:bg-slate-900",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// --- Badge ---
export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" | "success" | "warning" }) => {
  const variants = {
    default: "border-transparent bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30",
    secondary: "border-transparent bg-slate-700 text-slate-300",
    outline: "text-slate-300 border-slate-700",
    success: "border-transparent bg-emerald-500/20 text-emerald-300",
    warning: "border-transparent bg-amber-500/20 text-amber-300",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />
  );
};

// --- Slider ---
export const Slider = React.forwardRef<React.ElementRef<typeof RadixSlider.Root>, React.ComponentPropsWithoutRef<typeof RadixSlider.Root>>(({ className, ...props }, ref) => (
  <RadixSlider.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <RadixSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-800">
      <RadixSlider.Range className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500" />
    </RadixSlider.Track>
    <RadixSlider.Thumb className="block h-5 w-5 rounded-full border-2 border-indigo-500 bg-slate-950 ring-offset-slate-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50" />
  </RadixSlider.Root>
));
Slider.displayName = RadixSlider.Root.displayName;

// --- Switch ---
export const Switch = React.forwardRef<React.ElementRef<typeof RadixSwitch.Root>, React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>>(({ className, ...props }, ref) => (
  <RadixSwitch.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-500 data-[state=unchecked]:bg-slate-700",
      className
    )}
    {...props}
    ref={ref}
  >
    <RadixSwitch.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </RadixSwitch.Root>
));
Switch.displayName = RadixSwitch.Root.displayName;

// --- Progress ---
export const Progress = React.forwardRef<React.ElementRef<typeof RadixProgress.Root>, React.ComponentPropsWithoutRef<typeof RadixProgress.Root>>(({ className, value, ...props }, ref) => (
  <RadixProgress.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-800", className)}
    {...props}
  >
    <RadixProgress.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </RadixProgress.Root>
));
Progress.displayName = RadixProgress.Root.displayName;
