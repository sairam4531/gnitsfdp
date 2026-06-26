import { Link } from "@tanstack/react-router";

export function SiteFooter({
  footerText,
  email,
  phone,
}: {
  footerText?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  return (
    <footer id="contact" className="border-t bg-navy text-navy-foreground">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h4 className="mb-2 font-bold">GNITS — CSE (AI & ML) & CSE (Data Science)</h4>
          <p className="text-sm opacity-80">
            G. Narayanamma Institute of Technology and Science, Hyderabad
          </p>
        </div>
        <div>
          <h4 className="mb-2 font-bold">Contact</h4>
          <p className="text-sm opacity-80">{email ?? "+91 8790883408"}</p>
          {phone && <p className="text-sm opacity-80">{phone}</p>}
        </div>
        <div>
          <h4 className="mb-2 font-bold">Quick Links</h4>
          <div className="flex flex-col gap-1 text-sm opacity-80">
            <Link to="/register" className="hover:text-gold">
              Register
            </Link>
            {/* <Link to="/auth" className="hover:text-gold">Admin Login</Link> */}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        {footerText ?? "© G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad"}
      </div>
    </footer>
  );
}
