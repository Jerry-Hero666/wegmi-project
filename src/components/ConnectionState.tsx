"use client";
import { formatEther } from "viem";
import { useBalance, useConnection, useDisconnect } from "wagmi";

export default function ConnectionState() {
  const connection = useConnection();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: connection.address as `0x${string}`,
    chainId: connection.chainId as 1 | 11155111 | 137 | 42161,
    query: {
      staleTime: 30 * 100,
      gcTime: 10 * 60 * 100,
      enabled: connection.status === "connected",
      refetchInterval: 30 * 1000,
    },
  });
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-2 rounded-md">
      <h2 className="text-2xl">Connection</h2>
      <div className="p-2 rounded-md">
        <div className="flex justify-start">
          <div className="mr-2">status:</div>
          <div>{connection.status}</div>
        </div>
        <div className="flex items-center justify-start">
          <div className="mr-2">addresses:</div>
          <div>{JSON.stringify(connection.addresses)}</div>
        </div>
        <div className="flex items-center justify-start">
          <div className="mr-2">chainId:</div>
          <div>{connection.chainId}</div>
        </div>
        <div className="flex items-center justify-start">
          <div className="mr-2">balance:</div>
          <div>{formatEther(BigInt(balance?.value ?? 0))} ETH</div>
        </div>
      </div>
      <div>
        {connection.status === "connected" && (
          <button
            className="bg-blue-500 text-white p-2 rounded-md cursor-pointer"
            type="button"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
