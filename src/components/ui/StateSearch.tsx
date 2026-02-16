import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { INDIAN_STATES } from "@/lib/india-states"

interface StateSearchProps {
    value?: string;
    onSelect: (value: string) => void;
}

export function StateSearch({ value, onSelect }: StateSearchProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between mt-1.5"
                >
                    {value
                        ? INDIAN_STATES.find((state) => state === value)
                        : "Select State..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search state..." />
                    <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                            {INDIAN_STATES.map((state) => (
                                <CommandItem
                                    key={state}
                                    value={state}
                                    onSelect={(currentValue) => {
                                        // shadcn command sometimes lowercases values, but we want exact match
                                        // or just use the direct state string since it's the value
                                        onSelect(state)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === state ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {state}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
