"use client";
import { useEffect, useState } from "react";
import { erc20Abi, formatEther, parseEther, parseGwei, parseUnits } from "viem";
import {
  useConnection,
  usePublicClient,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const TOKEN_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC Mainnet

export default function SafeTokenTransfer() {
  const connection = useConnection();
  const publicClient = usePublicClient(); // 用于获取当前网络 gas 建议值
  const isConnected = connection.status === "connected";
  const [toAddress, setToAddress] = useState("");
  const [amountStr, setAmountStr] = useState("");
  // 手动 gas 参数状态（用户可调节，或 fallback 时使用）
  const [manualGasLimit, setManualGasLimit] = useState<string>(""); // e.g. "120000"
  const [manualGasPrice, setManualGasPrice] = useState<string>(""); // e.g. "5" → 5 gwei
  const [useManualParams, setUseManualParams] = useState(false); // 是否强制使用手动参数
  const [currentGasPrice, setCurrentGasPrice] = useState<string>("加载中"); // 当前 gas price

  const amount = parseUnits(amountStr || "0", 6);

  // 获取当前 gas price
  useEffect(() => {
    const fetchGasPrice = async () => {
      if (publicClient && useManualParams) {
        try {
          const gasPrice = await publicClient.getGasPrice();
          setCurrentGasPrice(formatEther(gasPrice, "gwei"));
        } catch (error) {
          setCurrentGasPrice("获取失败");
        }
      }
    };
    fetchGasPrice();
  }, [publicClient, useManualParams]);

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
  console.log("🚀 ~ simulation:", simError);

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
  const handleTransfer = async () => {
    if (!simulation?.request) return;

    // 基础 request（从 simulate 得来）
    let request = { ...simulation.request };

    // 如果用户选择手动参数，则覆盖
    if (useManualParams) {
      if (manualGasLimit && !isNaN(Number(manualGasLimit))) {
        request.gas = BigInt(manualGasLimit);
      }

      if (manualGasPrice && !isNaN(Number(manualGasPrice))) {
        // gasPrice 以 gwei 为单位输入，转换为 wei
        request.gasPrice = parseGwei(manualGasPrice);
      }

      // 注意：如果发送的是原生 ETH 转账（非合约调用），还需要加 value
      // request.value = parseEther('0.1') // 示例：发送 0.1 ETH
    }
    writeContract(request, {
      onSuccess: (hash) => console.log("Tx sent:", hash),
      onError: (err) => console.error("Write failed:", err),
    });
  };
  // 错误分类处理（面试爱问的点）
  const getErrorMessage = () => {
    if (isSimError && simError) {
      const msg = simError.message.toLowerCase();
      if (msg.includes("insufficient funds")) return "余额不足（ETH 或代币）";
      if (msg.includes("reverted"))
        return "合约执行会 revert（检查参数或余额）";
      if (msg.includes("gas"))
        return "自动 gas 估算失败，可尝试手动设置 gasLimit";
      return `模拟失败: ${simError.message}`;
    }

    if (isWriteError && writeError) {
      const msg = writeError.message.toLowerCase();
      if (msg.includes("user rejected")) return "已取消签名";
      if (msg.includes("insufficient funds"))
        return "发送时 ETH 余额不足支付 gas";
      if (msg.includes("nonce too low")) return "Nonce 错误，请刷新页面重试";
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
              placeholder="请输入以0x开头的接收地址"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">数量</label>
            <input
              type="text"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="请输入发送数量"
            />
          </div>

          {/* 手动 Gas 参数区 - 生产中常作为高级选项 */}
          <div className="mb-6 p-4 bg-gray-50 rounded border">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={useManualParams}
                onChange={(e) => setUseManualParams(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">
                使用手动 Gas 参数（高级）
              </span>
            </label>

            {useManualParams && (
              <>
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    Gas Limit
                  </label>
                  <input
                    type="text"
                    value={manualGasLimit}
                    onChange={(e) => setManualGasLimit(e.target.value)}
                    placeholder="eg 120000"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Max Gas Price (gwei) - 当前建议: {currentGasPrice}
                  </label>
                  <input
                    type="text"
                    value={manualGasPrice}
                    onChange={(e) => setManualGasPrice(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </>
            )}
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
