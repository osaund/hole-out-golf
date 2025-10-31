import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrizeClaimBannerProps {
  onOpenForm: () => void;
}

export const PrizeClaimBanner = ({ onOpenForm }: PrizeClaimBannerProps) => {
  return (
    <div className="bg-gradient-prize rounded-xl p-3 md:p-4 shadow-card mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        <div className="text-center sm:text-left">
          <h2 className="text-lg md:text-xl font-bold text-secondary-foreground">Got a hole in one?! 🎉</h2>
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
