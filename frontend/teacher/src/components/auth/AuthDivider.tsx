// src/components/auth/AuthDivider.tsx

interface Props {
  text?: string;
}

export default function AuthDivider({ text = "or" }: Props) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-slate-200" />

      <span className="text-xs uppercase tracking-wider text-slate-400">
        {text}
      </span>

      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}