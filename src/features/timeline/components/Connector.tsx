import type { Connector as ConnectorModel } from "../lib/layout";

interface ConnectorProps {
  connector: ConnectorModel;
  golden: boolean;
}

export function Connector({ connector, golden }: ConnectorProps) {
  const vertical = connector.direction === "down";
  const rotation =
    connector.direction === "right"
      ? 0
      : connector.direction === "left"
        ? 180
        : 90;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute grid place-items-center transition-opacity duration-300"
      style={{
        left: connector.x,
        top: connector.y,
        width: connector.width,
        height: connector.height,
      }}
    >
      <div
        className="transition-colors duration-300"
        style={{
          transform: `rotate(${rotation}deg)`,
          color: golden ? "var(--watched)" : "var(--muted-foreground)",
          opacity: golden ? 1 : 0.45,
        }}
      >
        <svg
          width={vertical ? 68 : 62}
          height={14}
          viewBox="0 0 62 14"
          fill="none"
          className="overflow-visible"
        >
          <path
            d="M0 7 H50"
            stroke="currentColor"
            strokeWidth={golden ? 2.5 : 2}
            strokeLinecap="round"
            strokeDasharray={golden ? undefined : "6 5"}
          />
          <path d="M44 1.5 L54 7 L44 12.5 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
