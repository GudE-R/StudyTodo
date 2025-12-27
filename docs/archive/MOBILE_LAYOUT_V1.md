# Mobile Layout V1: Tap-to-Expand (Archive)

**Archived on**: 2025-12-13
**Reason**: Shift functionality to PC-first dashboard (3-column layout). This mobile-optimized layout is saved for future reference when building the native mobile app or a dedicated mobile web view.

## Concept
- **Tap-to-Expand**: On mobile, Todo List, Schedule, and Calendar are small widgets. Tapping them expands the pane to a full-screen overlay (`fixed inset-0 z-50`).
- **Smooth Transition**: Uses CSS transitions for expansion (height/width/position).

## Component: `ExpandablePane.tsx`

```tsx
import React, { useState, useEffect } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface ExpandablePaneProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    isExpanded?: boolean;
    onExpandToggle?: (expanded: boolean) => void;
}

export function ExpandablePane({
    title,
    icon,
    children,
    defaultExpanded = false,
    className = "",
    isExpanded: controlledIsExpanded,
    onExpandToggle
}: ExpandablePaneProps) {
    const [internalIsExpanded, setInternalIsExpanded] = useState(defaultExpanded);

    const isExpanded = controlledIsExpanded ?? internalIsExpanded;

    const toggleExpand = () => {
        const newState = !isExpanded;
        if (onExpandToggle) {
            onExpandToggle(newState);
        } else {
            setInternalIsExpanded(newState);
        }
    };

    // Close on Start/End Time selection (simulated by checking if children change significantly? No, simpler to just let parent handle closing)
    // Actually, in page.tsx we handled closing.

    return (
        <div
            className={`
                transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col
                ${isExpanded
                    ? "fixed inset-0 z-50 m-0 rounded-none w-screen h-screen"
                    : `w-full ${className}` // Relative in normal flow
                }
            `}
        >
            {/* Header */}
            <div
                onClick={toggleExpand}
                className={`
                    flex items-center justify-between p-4 cursor-pointer select-none
                    ${isExpanded ? "bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                `}
            >
                <div className="flex items-center space-x-3">
                    {icon && <span className="text-blue-500 dark:text-blue-400">{icon}</span>}
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                </div>

                <button
                    className="p-1 rounded-full text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                    {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-hidden flex flex-col relative`}>
                {children}
            </div>

            {/* Close button (Floating for easy thumb access on mobile) */}
            {isExpanded && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand();
                    }}
                    className="absolute bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors sm:hidden z-50"
                >
                    <X size={24} />
                </button>
            )}
        </div>
    );
}
```

## Usage Pattern (in `page.tsx`)

```tsx
// State
const [expandedView, setExpandedView] = useState<"todo" | "schedule" | "calendar" | null>(null);

// JSX
<div className="space-y-4 pb-24">
    {/* Todo Pane */}
    <ExpandablePane
        title="Tasks"
        icon={<CheckCircle size={20} />}
        isExpanded={expandedView === "todo"}
        onExpandToggle={(expanded) => setExpandedView(expanded ? "todo" : null)}
        className="h-[400px]" // Initial height
    >
        <TodoList ... />
    </ExpandablePane>

    {/* Schedule Pane */}
    <ExpandablePane
        title="Schedule"
        icon={<Clock size={20} />}
        isExpanded={expandedView === "schedule"}
        onExpandToggle={(expanded) => setExpandedView(expanded ? "schedule" : null)}
        className="h-[500px]"
    >
        <DaySchedule ... />
    </ExpandablePane>
</div>
```
