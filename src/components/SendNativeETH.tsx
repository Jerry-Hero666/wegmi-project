// app/components/SendNativeETH.tsx
"use client";

import { useState } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useEstimateGas, // 用于安全估算 gas（推荐 fallback）
  usePublicClient, // 获取当前 gasPrice 作为参考
} from "wagmi";
import { parseEther, formatEther } from "viem";

export default function SendNativeETH() {
  const { isConnected, chain } = useAccount();

  const [toAddress, setToAddress] = useState("");
  const [amountStr, setAmountStr] = useState(""); // 默认 0.01 ETH
  const amount = parseEther(amountStr || "0");

  // 手动 gas 参数（fallback 或高级用户）
  const [manualGasLimit, setManualGasLimit] = useState<string>("");
  const [useManualGas, setUseManualGas] = useState(false);

  // Step 1: 估算 gas（推荐先估算，防失败）
  const {
    data: estimatedGas,
    error: estimateError,
    isLoading: isEstimating,
  } = useEstimateGas({
    to: toAddress as `0x${string}`,
    value: amount,
    query: {
      enabled: isConnected && !!toAddress && amount > BigInt(0),
    },
  });

  // Step 2: 发送交易
  const {
    mutate: sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
    isError: isSendError,
  } = useSendTransaction();

  // Step 3: 等待确认
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const handleSend = async () => {
    if (!toAddress || amount <= BigInt(0)) {
      alert("请输入有效地址和金额");
      return;
    }

    try {
      // 基础参数
      const txParams: any = {
        to: toAddress as `0x${string}`,
        value: amount,
      };

      // 如果估算成功，用估算的 gas（加 20% buffer 防波动）
      if (estimatedGas) {
        txParams.gas = (estimatedGas * BigInt(120)) / BigInt(100); // +20% buffer
      }

      // 手动覆盖 gasLimit（如果用户勾选）
      if (useManualGas && manualGasLimit && !isNaN(Number(manualGasLimit))) {
        txParams.gas = BigInt(manualGasLimit);
      }

      // 发送（wagmi 会自动处理 gasPrice / EIP-1559）
      sendTransaction(txParams, {
        onSuccess: (hash) => console.log("Tx sent:", hash),
        onError: (err) => console.error("Send failed:", err),
      });
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // 错误消息分类（面试常考的生产级处理）
  const getErrorMessage = () => {
    if (estimateError) {
      const msg = estimateError.message.toLowerCase();
      if (msg.includes("insufficient funds"))
        return "余额不足（ETH 不足支付金额 + gas）";
      if (msg.includes("gas"))
        return "Gas 估算失败，请检查网络或手动设置 gasLimit";
      return `估算失败: ${estimateError.message}`;
    }

    if (isSendError && sendError) {
      const msg = sendError.message.toLowerCase();
      if (msg.includes("user rejected")) return "用户取消了签名";
      if (msg.includes("insufficient funds")) return "发送时 ETH 余额不足";
      if (msg.includes("nonce")) return "Nonce 错误，请刷新重试";
      return `发送失败: ${sendError.message}`;
    }

    return null;
  };

  const errorMsg = getErrorMessage();

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        发送原生 {chain?.nativeCurrency.symbol || "ETH"}
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              发送数量 ({chain?.nativeCurrency.symbol || "ETH"})
            </label>
            <input
              type="text"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="请输入发送数量"
            />
          </div>

          {/* 手动 Gas 选项 */}
          <div className="mb-6 p-4 bg-gray-50 rounded border">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={useManualGas}
                onChange={(e) => setUseManualGas(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">
                手动设置 Gas Limit（高级）
              </span>
            </label>

            {useManualGas && (
              <input
                type="text"
                value={manualGasLimit}
                onChange={(e) => setManualGasLimit(e.target.value)}
                placeholder="e.g. 21000 (标准 ETH 转账)"
                className="w-full p-2 border rounded text-sm"
              />
            )}
            <p className="mt-2 text-xs text-gray-500">
              自动估算 gas:{" "}
              {estimatedGas ? estimatedGas.toString() : "计算中..."}
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={
              isEstimating ||
              isSending ||
              isConfirming ||
              !isConnected ||
              amount <= BigInt(0) ||
              !toAddress
            }
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isEstimating
              ? "估算 Gas 中..."
              : isSending
                ? "签名中..."
                : isConfirming
                  ? "确认中..."
                  : `发送 ${amountStr} ${chain?.nativeCurrency.symbol || "ETH"}`}
          </button>

          {txHash && !receipt && (
            <p className="mt-4 text-center text-sm text-gray-600 break-all">
              Tx Hash: {txHash}
            </p>
          )}

          {isConfirmed && (
            <p className="mt-4 text-center text-green-600 font-medium">
              发送成功！✓ 已确认在区块中
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
