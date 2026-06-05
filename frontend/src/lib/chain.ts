import { createPublicClient, http, type Address } from "viem";
import { sepolia } from "viem/chains";

export const DEMO_BORROWER =
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;

const rpcUrl = import.meta.env.VITE_RPC_URL as string | undefined;
const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? sepolia.id);

export const envOracleAddress = import.meta.env.VITE_ORACLE_ADDRESS as Address | undefined;
export const envConsumerAddress = import.meta.env.VITE_CONSUMER_ADDRESS as Address | undefined;

export const publicClient = rpcUrl
  ? createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    })
  : null;

export const riskOracleAbi = [
  {
    name: "latestEpoch",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint64" }],
  },
  {
    name: "committedModelHash",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "committedAdapterHash",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "getLatestScore",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "modelHash", type: "bytes32" },
          { name: "adapterHash", type: "bytes32" },
          { name: "epoch", type: "uint64" },
          { name: "scoreBps", type: "uint256" },
          { name: "borrower", type: "address" },
          { name: "timestamp", type: "uint64" },
          { name: "blockNumber", type: "uint64" },
        ],
      },
    ],
  },
] as const;

export const riskConsumerAbi = [
  {
    name: "getBorrowerPolicy",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "borrower", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "bucket", type: "uint8" },
          { name: "collateralFactorBps", type: "uint256" },
          { name: "borrowSpreadBps", type: "uint256" },
          { name: "borrowAllowed", type: "bool" },
          { name: "mitigationFlag", type: "bool" },
          { name: "lastEpoch", type: "uint64" },
        ],
      },
    ],
  },
] as const;

export type ChainAddressOverrides = {
  oracle?: string;
  consumer?: string;
};

export type LiveChainStatus = {
  latestEpoch: number;
  scoreBps?: number;
  borrower?: string;
  collateralFactorBps?: number;
  borrowSpreadBps?: number;
  borrowAllowed?: boolean;
  modelHash?: string;
  adapterHash?: string;
  oracleAddress?: string;
  consumerAddress?: string;
  source: "live" | "json";
};

function asAddress(value?: string): Address | undefined {
  if (!value || !value.startsWith("0x") || value.length !== 42) return undefined;
  return value as Address;
}

export function resolveChainAddresses(overrides?: ChainAddressOverrides): {
  oracle?: Address;
  consumer?: Address;
  source: "env" | "json" | "none";
} {
  const oracle = asAddress(envOracleAddress) ?? asAddress(overrides?.oracle);
  const consumer = asAddress(envConsumerAddress) ?? asAddress(overrides?.consumer);
  const source = envOracleAddress
    ? "env"
    : overrides?.oracle
      ? "json"
      : "none";
  return { oracle, consumer, source };
}

export function chainReadsEnabled(overrides?: ChainAddressOverrides): boolean {
  const { oracle } = resolveChainAddresses(overrides);
  return Boolean(publicClient && oracle);
}

export async function readLiveChainStatus(
  overrides?: ChainAddressOverrides,
): Promise<LiveChainStatus | null> {
  const { oracle, consumer } = resolveChainAddresses(overrides);
  if (!publicClient || !oracle) return null;

  const latestEpoch = Number(
    await publicClient.readContract({
      address: oracle,
      abi: riskOracleAbi,
      functionName: "latestEpoch",
    }),
  );

  const modelHash = await publicClient.readContract({
    address: oracle,
    abi: riskOracleAbi,
    functionName: "committedModelHash",
  });

  const adapterHash = await publicClient.readContract({
    address: oracle,
    abi: riskOracleAbi,
    functionName: "committedAdapterHash",
  });

  const live: LiveChainStatus = {
    latestEpoch,
    modelHash,
    adapterHash,
    oracleAddress: oracle,
    consumerAddress: consumer,
    source: "live",
  };

  if (latestEpoch > 0) {
    const score = await publicClient.readContract({
      address: oracle,
      abi: riskOracleAbi,
      functionName: "getLatestScore",
    });
    live.scoreBps = Number(score.scoreBps);
    live.borrower = score.borrower;
  }

  if (consumer) {
    const policy = await publicClient.readContract({
      address: consumer,
      abi: riskConsumerAbi,
      functionName: "getBorrowerPolicy",
      args: [DEMO_BORROWER],
    });
    live.collateralFactorBps = Number(policy.collateralFactorBps);
    live.borrowSpreadBps = Number(policy.borrowSpreadBps);
    live.borrowAllowed = policy.borrowAllowed;
  }

  return live;
}

export { chainId };
