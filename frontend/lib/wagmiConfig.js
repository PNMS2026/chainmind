import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, localhost } from "wagmi/chains";
import { http } from "viem";

export const config = getDefaultConfig({
  appName: "ChainMind",
  projectId: "YOUR_PROJECT_ID", // Dummy project ID for MVP local setup
  chains: [localhost, sepolia],
  transports: {
    [localhost.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(),
  },
  ssr: true, // If your dApp uses Server Side Rendering (SSR)
});
