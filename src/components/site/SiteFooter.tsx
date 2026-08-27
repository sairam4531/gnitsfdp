import { Link } from "@tanstack/react-router";
import { useCoordinators } from "@/lib/queries";
import { Phone, Mail } from "lucide-react";

export function SiteFooter({
  footerText,
  email,
  phone,
}: {
  footerText?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  const { data: coords = [] } = useCoordinators();

  const facultyCoords = coords.filter((c) => c.type === "Faculty");
  const studentCoords = coords.filter((c) => c.type === "Student");

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
          <h4 className="mb-3 font-bold">Contact Us</h4>
          {email && (
            <div className="flex items-center gap-2 text-sm opacity-80 mb-3">
              <Mail className="h-4 w-4 text-gold" />
              <span>{email}</span>
            </div>
          )}

          {facultyCoords.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs uppercase tracking-wider text-gold font-bold mb-1.5">
                Faculty Co-ordinators
              </h5>
              <div className="space-y-2">
                {facultyCoords.map((c) => (
                  <div key={c.id} className="text-sm opacity-80 flex flex-col">
                    <span className="font-semibold text-white">
                      {c.name} ({c.department})
                    </span>
                    <span className="text-xs flex items-center gap-1 opacity-70">
                      <Phone className="h-3 w-3 text-gold" /> {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentCoords.length > 0 && (
            <div>
              <h5 className="text-xs uppercase tracking-wider text-gold font-bold mb-1.5">
                Student Co-ordinators
              </h5>
              <div className="space-y-2">
                {studentCoords.map((c) => (
                  <div key={c.id} className="text-sm opacity-80 flex flex-col">
                    <span className="font-semibold text-white">
                      {c.name} ({c.department})
                    </span>
                    <span className="text-xs flex items-center gap-1 opacity-70">
                      <Phone className="h-3 w-3 text-gold" /> {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {facultyCoords.length === 0 && studentCoords.length === 0 && phone && (
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Phone className="h-4 w-4 text-gold" />
              <span>{phone}</span>
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-2 font-bold">Quick Links</h4>
          <div className="flex flex-col gap-1 text-sm opacity-80">
            <Link to="/register" className="hover:text-gold">
              Register
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        {footerText ?? "© G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad"}
      </div>
    </footer>
  );
}
