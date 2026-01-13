"use client";
import { useState } from "react";
import { erc20Abi, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useChains,
  useConnection,
  useSimulateContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const TOKEN_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // 示例：USDC Mainnet

export default function SafeTokenTransfer() {
  const connection = useConnection();
  const isConnected = connection.status === "connected";
  const [toAddress, setToAddress] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const amount = parseUnits(amountStr || "0", 6);
  // Step 1: 模拟（最关键的安全层）
  const {
    data: simulation,
    error: simError,
    isLoading: isSimulating,
    isError: isSimError,
  } = useSimulateContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "transfer",
    args: [toAddress as `0x${string}`, amount],
    // 可选：手动指定 gas / gasPrice（fallback 当自动估算失败时）
    // gas: 100_000n,
    query: {
      enabled: isConnected && !!toAddress && amount > 0, // 防无效模拟
      staleTime: 10_000, // 10秒内不重复模拟
    },
  });

  // Step 2: 实际写入（只有模拟成功才允许）
  const {
    mutate: writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    isError: isWriteError,
  } = useWriteContract();

  // Step 3: 等待确认（生产必备）
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    // pollingInterval: 4_000, // 可调，默认合理
  });

  // 触发写入
  const handleTransfer = () => {
    console.log("🚀 ~ simError:", simError);
    console.log("🚀 ~ simulation:", simulation);
    if (simulation?.request) {
      writeContract(simulation.request, {
        // 可选：onSuccess / onError 回调（v3 仍支持 mutation callbacks）
        onSuccess: (hash) => {
          console.log("Transaction sent:", hash);
        },
        onError: (err) => {
          console.error("Write failed:", err);
        },
      });
    }
  };

  // 错误分类处理（面试爱问的点）
  const getErrorMessage = () => {
    if (isSimError && simError) {
      const msg = simError.message.toLowerCase();
      if (msg.includes("insufficient funds")) return "余额不足（ETH 或代币）";
      if (msg.includes("reverted"))
        return "合约执行失败（可能余额不够/逻辑错误）";
      if (msg.includes("gas"))
        return "Gas 估算失败，请检查网络或手动调整 gasLimit";
      return `模拟失败: ${simError.message}`;
    }

    if (isWriteError && writeError) {
      const msg = writeError.message.toLowerCase();
      if (msg.includes("user rejected")) return "用户取消了签名";
      if (msg.includes("insufficient funds")) return "发送交易时余额不足";
      return `交易失败: ${writeError.message}`;
    }

    return null;
  };

  const errorMsg = getErrorMessage();

  // 0x77092Ce7A8EFF5Ef0Ef0eEe5B72D207a39039eDF
  return (
    <div className="p-6 bg-orange-100 rounded-xl shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        安全转账（两步走）
      </h2>

      {!isConnected && (
        <p className="text-red-600 text-center mb-4">请先连接钱包</p>
      )}

      {isConnected && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">接收地址</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0x..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">数量</label>
            <input
              type="text"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="1.0"
            />
          </div>
          <button
            onClick={handleTransfer}
            disabled={
              !simulation?.request ||
              isSimulating ||
              isWritePending ||
              isConfirming ||
              !isConnected
            }
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSimulating
              ? "模拟中..."
              : isWritePending
                ? "签名中..."
                : isConfirming
                  ? "确认中..."
                  : "安全转账"}
          </button>

          {txHash && !receipt && (
            <p className="mt-4 text-center text-sm text-gray-600">
              交易已发送: {txHash.slice(0, 6)}...{txHash.slice(-4)}
            </p>
          )}

          {isConfirmed && (
            <p className="mt-4 text-center text-green-600 font-medium">
              转账成功！区块确认 ✓
            </p>
          )}

          {errorMsg && (
            <p className="mt-4 text-center text-red-600 font-medium">
              {errorMsg}
            </p>
          )}
        </>
      )}
    </div>
  );
}
