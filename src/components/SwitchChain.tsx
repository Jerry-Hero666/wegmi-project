"use client";
import { useChains, useSwitchChain } from "wagmi";

export default function SwitchChain() {
  const chains = useChains();
  const { mutate } = useSwitchChain();
  return (
    <div className="bg-blue-100 p-8">
      <h2 className="text-2xl">Switch Chains</h2>
      <div className="flex gap-2 justify-center items-center">
        {chains.map((el) => {
          return (
            <button
              className="bg-blue-500 text-white p-2 rounded-md cursor-pointer"
              key={el.id}
              onClick={() => mutate({ chainId: el.id })}
            >
              {el.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
