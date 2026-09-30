import Link from "next/link";
import { LucideIcon, PackageSearch, ShoppingBag, School, MessageCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  contactPrompt?: boolean;
  action?: {
    label: string;
    href: string;
  };
  onClick?: () => void;
}

export default function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  contactPrompt = false,
  action,
  onClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 px-4 text-center">
      <div className="w-20 h-20 bg-[var(--color-teal)]/5 rounded-full flex items-center justify-center text-[var(--color-teal)]">
        <Icon size={36} />
      </div>
      <div>
        <h3 className="font-heading text-[var(--color-teal)] text-2xl mb-2">{title}</h3>
        <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          action.href === "#" ? (
            <button
              onClick={onClick}
              className="px-6 py-3 bg-[var(--color-teal)] text-white rounded-xl font-bold text-sm hover:bg-[var(--color-teal)]/90 transition-all shadow-md shadow-[var(--color-teal)]/20"
            >
              {action.label}
            </button>
          ) : (
            <Link
              href={action.href}
              className="px-6 py-3 bg-[var(--color-teal)] text-white rounded-xl font-bold text-sm hover:bg-[var(--color-teal)]/90 transition-all shadow-md shadow-[var(--color-teal)]/20"
            >
              {action.label}
            </Link>
          )
        )}
        {contactPrompt && (
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-400 text-green-600 rounded-xl font-bold text-sm hover:bg-green-50 transition-all"
          >
            <MessageCircle size={16} /> Contact Us on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// Pre-built empty state variants for common use-cases
export const EmptyUniforms = ({ schoolName }: { schoolName?: string }) => (
  <EmptyState
    icon={PackageSearch}
    title="No Uniforms Found"
    description={
      schoolName
        ? `No uniform items have been added for ${schoolName} yet. Contact us and we'll help you!`
        : "No uniforms available for this selection yet. Contact us for assistance."
    }
    contactPrompt
    action={{ label: "Browse Other Schools", href: "/uniform/select-school" }}
  />
);

export const EmptyOrders = () => (
  <EmptyState
    icon={ShoppingBag}
    title="No Orders Yet"
    description="You haven't placed any orders yet. Start shopping to fill this page!"
    action={{ label: "Start Shopping", href: "/uniform/select-school" }}
  />
);

export const EmptySchools = () => (
  <EmptyState
    icon={School}
    title="No Schools Available"
    description="We haven't listed any schools yet. Please contact us to add your school."
    contactPrompt
  />
);
