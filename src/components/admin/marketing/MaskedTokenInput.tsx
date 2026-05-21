import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}

const MaskedTokenInput = ({ value, onChange, placeholder, id }: Props) => {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-none font-mono pr-20"
        autoComplete="off"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="p-1.5 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide token" : "Show token"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={!value}
          className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Copy token"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default MaskedTokenInput;
