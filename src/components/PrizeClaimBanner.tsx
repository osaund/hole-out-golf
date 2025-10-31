import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrizeClaimBannerProps {
  onOpenForm: () => void;
}

export const PrizeClaimBanner = ({ onOpenForm }: PrizeClaimBannerProps) => {
  return (
    <div className="bg-gradient-prize rounded-xl p-4 md:p-6 shadow-card mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-background/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-secondary-foreground mb-0.5">Win Cash Prizes!</h2>
            <p className="text-sm md:text-base text-secondary-foreground/80">Hole-in-one? Up to £1,000!</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onOpenForm}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg w-full sm:w-auto"
        >
          Submit Claim
        </Button>
      </div>
    </div>
  );
};
