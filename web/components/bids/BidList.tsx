import type { Bid } from "@/types/bid";
import BidCard from "@/components/bids/BidCard";

export default function BidList({ bids }: { bids: Bid[] }) {
  return (
    <div className="mt-6 space-y-4">
      {bids.map((bid) => (
        <BidCard bid={bid} key={bid.id} />
      ))}
    </div>
  );
}
