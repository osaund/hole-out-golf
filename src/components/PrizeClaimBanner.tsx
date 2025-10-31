import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrizeClaimBannerProps {
  onOpenForm: () => void;
}

export const PrizeClaimBanner = ({ onOpenForm }: PrizeClaimBannerProps) => {
  return (
    <div className="bg-gradient-prize rounded-xl p-8 shadow-card mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-background/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-secondary-foreground mb-1">Win Cash Prizes!</h2>
            <p className="text-secondary-foreground/80">Got a hole-in-one? Prizes up to £1,000 per course!</p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={onOpenForm}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          Submit Prize Claim
        </Button>
      </div>
    </div>
  );
};
