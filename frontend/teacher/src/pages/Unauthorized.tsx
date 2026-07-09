import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass-card max-w-xl p-10 text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-4">403</h1>
        <p className="text-xl text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <Link to="/" className="glass-button inline-flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Return Home
        </Link>
      </div>
    </div>
  );
};
