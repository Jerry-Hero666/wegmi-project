"use client";
import { useConnect, useConnectors } from "wagmi";

export default function ConnectWallent() {
  const { connect, status, error } = useConnect();
  const connectors = useConnectors();
  return (
    <div className="bg-indigo-100 p-8">
      <h2 className="text-2xl">Connect Wallet</h2>
      <div className="flex gap-2 justify-center items-center">
        {connectors.map((connector) => (
          <button
            className="bg-blue-500 text-white p-2 rounded-md cursor-pointer"
            key={connector.uid}
            onClick={() => {
              connect({ connector });
            }}
            type="button"
          >
            {connector.name}
          </button>
        ))}
      </div>

      <div className={`${error ? "text-red-500" : "text-green-500"}`}>
        {status}
      </div>
      <div className={`${error ? "text-red-500" : "text-green-500"}`}>
        {error?.message}
      </div>
    </div>
  );
}
