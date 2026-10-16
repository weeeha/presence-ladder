import exchange from "@/fixture/exchange.json";
import { LadderView } from "@/components/ladder-view";
import type { Exchange } from "@/lib/agent-source";

export default function Home() {
  return <LadderView exchange={exchange as Exchange} />;
}
