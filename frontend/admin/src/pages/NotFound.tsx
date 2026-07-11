import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B2545] px-4 text-center text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-2 text-lg text-white/80">Page not found</p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0B2545]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default NotFound;
