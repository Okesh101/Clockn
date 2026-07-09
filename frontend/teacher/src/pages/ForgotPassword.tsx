// src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast.success("If that email exists, we sent reset instructions.");
      setIsSubmitting(false);
    }, 1400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass-card max-w-lg w-full p-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-3xl bg-purple-100 text-purple-700 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600">
            Enter your email and we will send a reset link to help you regain
            access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="glass-button w-full flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
