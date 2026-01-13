"use client";
import BatchReader from "@/components/BatchReader";
import SwitchChain from "@/components/SwitchChain";
import ConnectionState from "@/components/ConnectionState";
import ConnectWallent from "@/components/ConnectWallent";
import SafeTokenTransfer from "@/components/SafeTokenTransfer";

function App() {
  // const { mutate } = useReconnect();

  // useEffect(() => {
  // mutate();
  // }, []);

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
      {/* 安全转账 */}
      <SafeTokenTransfer />
    </div>
  );
}

export default App;
