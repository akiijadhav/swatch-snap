import { forwardRef, useCallback } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  label?: string;
}

const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(
  ({ color, onChange, className, label }, ref) => {
    const handleChange = useCallback(
      (value: string) => onChange(value),
      [onChange]
    );

    return (
      <Popover>
        <PopoverTrigger>
          <Button
            ref={ref}
            variant="outline"
            size="sm"
            className={cn(
              "flex w-full items-center gap-2 px-3 font-mono text-xs justify-start",
              className
            )}
          >
            <span
              className="h-4 w-4 rounded-sm border border-black/10 shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="uppercase">{color}</span>
            {label && (
              <span className="text-muted-foreground font-sans normal-case ml-auto">
                {label}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-3"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <HexColorPicker
            color={color}
            onChange={handleChange}
            style={{ width: "100%", height: "160px" }}
          />
          <div className="mt-3 flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring">
            <span className="text-muted-foreground font-mono text-xs">#</span>
            <HexColorInput
              color={color}
              onChange={handleChange}
              className="flex-1 bg-transparent font-mono text-xs uppercase focus:outline-none ml-1 text-foreground"
              prefixed={false}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
