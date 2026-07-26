import Card from "./ui/Card";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function InfoCard({ title, children, className = "" }: InfoCardProps) {
  return (
    <Card padding="lg" className={className}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <div className="mt-2.5 text-sm leading-relaxed text-gray-600">
        {children}
      </div>
    </Card>
  );
}
