import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from "wagmi";
import { mainnet, sepolia, polygon, arbitrum } from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, polygon, arbitrum] as const,
    connectors: [
      injected(),
      metaMask(),
      walletConnect({
        projectId: projectId as string,
        // 可选：显示推荐的钱包列表
        showQrModal: true,
        // 可选：metadata 用于 WalletConnect 展示你的 DApp 信息
        metadata: {
          name: "My Awesome DApp",
          description: "Web3 frontend example",
          url: "https://your-dapp.com",
          icons: ["https://your-dapp.com/icon.png"],
        },
      }),
      coinbaseWallet({
        appName: "My Awesome DApp",
        // 可选：preference 设置默认打开方式
        preference: "smartWalletOnly", // 或 'allWallets'
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
    },
    syncConnectedChain: true, // 自动同步连接的链（用户切换链时更新 UI）
    batch: { multicall: true },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
// NEXT_TELEMETRY_DISABLED="1"
