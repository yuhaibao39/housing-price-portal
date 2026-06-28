import Navbar from "./Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Housing Price Portal</span>
          <span>Powered by Next.js 16 • FastAPI • Spring Boot</span>
        </div>
      </footer>
    </div>
  );
}
