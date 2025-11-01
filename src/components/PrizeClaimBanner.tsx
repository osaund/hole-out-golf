import { Button } from "@/components/ui/button";

interface PrizeClaimBannerProps {
  onOpenForm: () => void;
}

export const PrizeClaimBanner = ({ onOpenForm }: PrizeClaimBannerProps) => {
  return (
    <div className="bg-gradient-prize rounded-lg p-4 shadow-soft mb-6 border border-secondary/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-foreground">Got a hole in one? 🎉</h2>
          <p className="text-sm text-primary-foreground/80 mt-0.5">Submit your claim to win prizes</p>
        </div>
        <Button
          onClick={onOpenForm}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium whitespace-nowrap"
        >
          Submit Claim
        </Button>
      </div>
    </div>
  );
};
