export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0B0B0B] flex items-center justify-center">
      {children}
    </div>
  );
}
