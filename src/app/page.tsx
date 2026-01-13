"use client";

import { erc20Abi, formatEther, formatUnits } from "viem";
import {
  useBalance,
  useChains,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSwitchChain,
} from "wagmi";
import BatchReader from "@/components/BatchReader";
import SwitchChain from "@/components/SwitchChain";
import ConnectionState from "@/components/ConnectionState";
import ConnectWallent from "@/components/ConnectWallent";

function App() {
  const connection = useConnection();
  const { connect, status, error } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { mutate } = useSwitchChain();

  const contract = useReadContract({
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [connection.address as `0x${string}`],
  });

  return (
    <div className="text-center space-y-4 mt-10">
      {/* 连接状态 */}
      <ConnectionState />
      {/* 连接钱包 */}
      <ConnectWallent />
      {/* 批量读取合约 */}
      <BatchReader />
      {/* 切换链 */}
      <SwitchChain />
    </div>
  );
}

export default App;
