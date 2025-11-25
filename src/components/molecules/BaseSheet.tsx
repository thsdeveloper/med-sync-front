"use client"

import { ReactNode } from "react"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type SheetSide = "top" | "right" | "bottom" | "left"

type SheetContentProps = React.ComponentProps<typeof SheetContent>
type SheetRootProps = React.ComponentProps<typeof Sheet>

export interface BaseSheetProps extends Omit<SheetRootProps, "children"> {
    trigger?: ReactNode
    title?: ReactNode
    description?: ReactNode
    footer?: ReactNode
    children: ReactNode
    side?: SheetSide
    contentClassName?: string
    headerClassName?: string
    bodyClassName?: string
    footerClassName?: string
    contentProps?: Omit<SheetContentProps, "children" | "className" | "side">
}

export function BaseSheet({
    trigger,
    title,
    description,
    footer,
    children,
    side = "right",
    contentClassName,
    headerClassName,
    bodyClassName,
    footerClassName,
    contentProps,
    ...sheetProps
}: BaseSheetProps) {
    return (
        <Sheet {...sheetProps}>
            {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}

            <SheetContent
                side={side}
                className={cn("flex h-full flex-col gap-0 p-0", contentClassName)}
                {...contentProps}
            >
                {title || description ? (
                    <SheetHeader className={cn("border-b px-4 pb-4 pt-6", headerClassName)}>
                        {title ? <SheetTitle>{title}</SheetTitle> : null}
                        {description ? <SheetDescription>{description}</SheetDescription> : null}
                    </SheetHeader>
                ) : null}

                <div className={cn("flex-1 overflow-auto px-4 py-6", bodyClassName)}>{children}</div>

                {footer ? (
                    <SheetFooter className={cn("border-t px-4 py-4", footerClassName)}>{footer}</SheetFooter>
                ) : null}
            </SheetContent>
        </Sheet>
    )
}


