// src/components/auth/AuthFooter.tsx

interface AuthFooterProps {
  text: string;
  action: string;
  onClick: () => void;
}

export default function AuthFooter({ text, action, onClick }: AuthFooterProps) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-6 text-center">
      <p className="text-sm text-slate-500">
        {text}{" "}
        <button
          type="button"
          onClick={onClick}
          className="
            font-semibold
            text-[#0B2545]
            transition-colors
            hover:text-blue-700
          "
        >
          {action}
        </button>
      </p>
    </div>
  );
}
