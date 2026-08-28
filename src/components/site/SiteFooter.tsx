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
    <footer id="contact" className="border-t border-amber-400/20 bg-slate-950 text-slate-100">
      <div className="container mx-auto grid gap-8 px-4 py-14 md:grid-cols-3">
        <div>
          <h4 className="mb-2 font-black text-lg text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            GNITS — CSE (Data Science)
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            G. Narayanamma Institute of Technology and Science (for Women), Hyderabad
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-black text-lg text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Contact Us
          </h4>
          {email && (
            <div className="flex items-center gap-2 text-sm text-amber-200 mb-4 bg-slate-900/90 border border-amber-400/30 px-3.5 py-2 rounded-xl w-fit">
              <Mail className="h-4 w-4 text-amber-400" />
              <span className="font-semibold">{email}</span>
            </div>
          )}

          {facultyCoords.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs uppercase tracking-widest text-amber-400 font-extrabold mb-2">
                Faculty Co-ordinators
              </h5>
              <div className="space-y-2.5">
                {facultyCoords.map((c) => (
                  <div key={c.id} className="text-sm bg-slate-900/80 border border-amber-400/20 p-2.5 rounded-xl flex flex-col">
                    <span className="font-bold text-white">
                      {c.name} ({c.department})
                    </span>
                    <span className="text-xs flex items-center gap-1.5 text-amber-300 font-semibold mt-1">
                      <Phone className="h-3.5 w-3.5 text-amber-400" /> {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentCoords.length > 0 && (
            <div>
              <h5 className="text-xs uppercase tracking-widest text-amber-400 font-extrabold mb-2">
                Student Co-ordinators
              </h5>
              <div className="space-y-2.5">
                {studentCoords.map((c) => (
                  <div key={c.id} className="text-sm bg-slate-900/80 border border-cyan-400/20 p-2.5 rounded-xl flex flex-col">
                    <span className="font-bold text-white">
                      {c.name} ({c.department})
                    </span>
                    <span className="text-xs flex items-center gap-1.5 text-cyan-300 font-semibold mt-1">
                      <Phone className="h-3.5 w-3.5 text-cyan-400" /> {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {facultyCoords.length === 0 && studentCoords.length === 0 && phone && (
            <div className="flex items-center gap-2 text-sm text-amber-200">
              <Phone className="h-4 w-4 text-amber-400" />
              <span>{phone}</span>
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-4 font-black text-lg text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Quick Links
          </h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/register" className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-2 hover:translate-x-1 transition-transform">
              → Workshop Registration
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-400 font-medium">
        {footerText ?? "© G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad. All Rights Reserved."}
      </div>
    </footer>
  );
}
