/** Raw payload served from /data/phase1-demo.json (sync-frontend-data.sh). */

export type ProverKind = "ezkl" | "circom";

export type Phase1DemoJson = {
  syncedAt: string;
  hasArtifacts: boolean;
  hasOnChain: boolean;
  epoch: {
    id: string;
    numeric: number;
    status: "active" | "ready" | "sealed";
  };
  commitments: {
    modelHash: string;
    adapterHash: string;
    modelHashShort: string;
    adapterHashShort: string;
  };
  features: {
    names: string[];
    values: number[];
    sampleIndex: number;
  };
  score: {
    float: number;
    bps: number;
    bucket: string;
    bucketRange: string;
    logitAcc?: number;
    publicInputCount?: number;
  };
  proof: {
    status: string;
    offChainVerify: boolean;
    lengthBytes: number;
    hashPrefix: string;
    ezklVersion: string;
    artifactPath: string;
    prover?: ProverKind;
  };
  verification: {
    result: string;
    onChain: boolean;
    chainId: number;
    verifierAdapter?: string;
    halo2Verifier?: string;
    oracle?: string;
    consumer?: string;
  };
  consumer: {
    borrower: string;
    borrowerShort: string;
    collateralFactorBps: number;
    collateralFactor: number;
    borrowSpreadBps: number;
    borrowAllowed: boolean;
    bucket: string;
    lastEpoch: number;
  };
  benchmark: {
    populated: boolean;
    note: string;
  };
};

export type DataLoadStatus = "loading" | "ready" | "empty" | "error";
