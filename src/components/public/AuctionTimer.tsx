import { useState, useEffect } from "react";
import { differenceInSeconds } from "date-fns";

interface AuctionTimerProps {
  endTime: string;
  onExpire?: () => void;
}

export const AuctionTimer = ({ endTime, onExpire }: AuctionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endTime);
      const seconds = differenceInSeconds(end, now);

      if (seconds <= 0) {
        setTimeLeft("Auction Ended");
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(seconds / (24 * 60 * 60));
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((seconds % (60 * 60)) / 60);
      const secs = seconds % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${secs}s`);
      } else {
        setTimeLeft(`${minutes}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  return (
    <div className={`text-sm font-medium ${isExpired ? "text-destructive" : "text-foreground"}`}>
      {timeLeft}
    </div>
  );
};
