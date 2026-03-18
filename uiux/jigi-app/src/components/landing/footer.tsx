import { Logo } from "@/components/Logo"

const footerColumns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  {
    title: "Solutions",
    links: ["For Agencies", "For Brands", "For Enterprise", "For Freelancers"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Blog", "Case Studies", "Support"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Press"],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-5">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" asLink={true} />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              From idea to approved creative in one workflow.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-1">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="block min-h-[44px] py-2 text-xs text-muted-foreground transition-colors hover:text-foreground md:min-h-0 md:py-0 md:leading-normal"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            {`\u00A9 ${new Date().getFullYear()} Jigi. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
