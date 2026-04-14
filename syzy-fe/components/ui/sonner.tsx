"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:border-0",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:bg-background group-[.toast]:text-foreground",
          error: "group-[.toast]:bg-background group-[.toast]:text-foreground",
          info: "group-[.toast]:bg-background group-[.toast]:text-foreground",
          warning: "group-[.toast]:bg-background group-[.toast]:text-foreground",
        }
      }}
      {...props}
    />
  )
}

export { Toaster }