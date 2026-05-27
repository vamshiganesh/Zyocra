import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ClippedButton } from "../ui/ClippedButton";
import "./ConnectButton.css";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <div className="connect-btn">
        <span className="connect-btn__meta mono-label">
          {short}
          {chain ? ` · ${chain.name}` : ""}
        </span>
        <ClippedButton type="button" variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </ClippedButton>
      </div>
    );
  }

  const connector = connectors[0];
  return (
    <ClippedButton
      type="button"
      variant="surface"
      size="sm"
      disabled={!connector || isPending}
      onClick={() => connector && connect({ connector })}
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </ClippedButton>
  );
}
