import Link from "next/link"

const footerLinks = {
  Resources: [
    { label: "Docs", href: "/x402/docs" },
    { label: "Examples", href: "/x402/examples" },
    { label: "SDK", href: "/x402/sdk" },
  ],
  Platform: [
    { label: "Main Site", href: "/dashboard" },
    { label: "Markets", href: "/markets" },
    { label: "Staking", href: "/staking" },
  ],
  Socials: [
    { label: "Discord", href: "https://discord.gg/fB6zG5Ck5q", external: true },
    { label: "Twitter / X", href: "https://x.com/OyradeX", external: true },
  ],
}

export function X402Footer() {
  return (
    <footer className="bg-neutral-900 dark:bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-neutral-300 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-neutral-500 text-sm">
          &copy; 2026 Syzy. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
