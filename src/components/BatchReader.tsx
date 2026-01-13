"use client";

import { useConnection, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits, parseAbi } from "viem"; // v3 依赖 viem
import { useAccount } from "wagmi";
import { useMemo } from "react";

const tokenLists = [
  {
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    symbol: "LINK",
    decimals: 18,
  },
  {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    symbol: "USDC",
    decimals: 6,
  },
];

export default function BatchReader() {
  const connection = useConnection();

  const contracts = useMemo(() => {
    return tokenLists.map((token) => {
      return {
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [connection.address as `0x${string}`],
      };
    });
  }, [tokenLists]);
  const { data: balanceContracts } = useReadContracts({
    allowFailure: true,
    contracts: contracts.map((it) => ({
      ...it,
      address: it.address as `0x${string}`,
    })),
    query: {
      staleTime: 30 * 100,
      gcTime: 10 * 60 * 100,
      enabled: connection.status === "connected",
      refetchInterval: 30 * 1000,
    },
  });
  return (
    <div className="bg-amber-100 p-8">
      <h2 className="text-2xl">My ERC-20</h2>
      {balanceContracts?.map((it, i) => {
        const token = tokenLists[i];
        const rowBanlance = it?.result ?? 0;
        const formatted = rowBanlance
          ? formatUnits(BigInt(rowBanlance), token.decimals)
          : 0;
        return (
          <div key={token.address}>
            {token.symbol}: {formatted}
          </div>
        );
      })}
    </div>
  );
}
