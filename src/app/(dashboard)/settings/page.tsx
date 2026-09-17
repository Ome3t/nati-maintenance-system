import Link from "next/link";
import { Users, Package, Truck, Activity, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      title: "User Management",
      description: "Add, edit, and manage cashiers and technicians",
      href: "/settings/users",
      icon: Users,
    },
    {
      title: "Categories",
      description: "Manage product categories for your inventory",
      href: "/settings/categories",
      icon: Package,
    },
    {
      title: "Suppliers",
      description: "Manage suppliers and vendors",
      href: "/settings/suppliers",
      icon: Truck,
    },
    {
      title: "Activity Logs",
      description: "See all system activity and user actions",
      href: "/settings/activity",
      icon: Activity,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your business settings and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-900 hover:shadow-sm transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <section.icon className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {section.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {section.description}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}