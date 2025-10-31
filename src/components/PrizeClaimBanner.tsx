import { Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrizeClaimBannerProps {
  onOpenForm: () => void;
}

export const PrizeClaimBanner = ({ onOpenForm }: PrizeClaimBannerProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-prize rounded-2xl shadow-card mb-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="relative flex flex-row items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-secondary/20 backdrop-blur-sm">
            <Trophy className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-secondary-foreground flex items-center gap-2">
              Got a hole in one?! 
              <Sparkles className="w-5 h-5 text-secondary" />
            </h2>
            <p className="text-sm text-secondary-foreground/80 mt-0.5 hidden sm:block">Submit your claim and win cash prizes</p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={onOpenForm}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg font-semibold whitespace-nowrap"
        >
          Submit Claim
        </Button>
      </div>
    </div>
  );
};
