import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PrizeClaimBannerProps {
  onOpenForm: () => void;
}

export const PrizeClaimBanner = ({ onOpenForm }: PrizeClaimBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-prize rounded-lg p-4 shadow-soft mb-6 border border-secondary/20">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-secondary-foreground/60 hover:text-secondary-foreground transition-colors"
        aria-label="Close banner"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-between gap-4 pr-6">
        <div>
          <h2 className="text-lg font-semibold text-secondary-foreground">Got a hole in one? 🎉</h2>
          <p className="text-sm text-secondary-foreground/70 mt-0.5">Submit your claim to win prizes</p>
        </div>
        <Button
          onClick={onOpenForm}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium whitespace-nowrap"
        >
          Submit Claim
        </Button>
      </div>
    </div>
  );
};
