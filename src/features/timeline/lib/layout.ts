import type { Title, TitleId } from "@/domain/entities/title";

export const CARD_WIDTH = 208;
export const CARD_HEIGHT = 300;
export const GAP_X = 92;
export const GAP_Y = 92;

export interface PlacedCard {
  title: Title;
  index: number;
  row: number;
  column: number;
  x: number;
  y: number;
}

export type ConnectorDirection = "right" | "left" | "down";

export interface Connector {
  id: string;
  fromId: TitleId;
  toId: TitleId;
  direction: ConnectorDirection;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardLayout {
  cards: PlacedCard[];
  connectors: Connector[];
  width: number;
  height: number;
  columns: number;
}

export function computeBoardLayout(
  titles: readonly Title[],
  columns: number,
): BoardLayout {
  const safeColumns = Math.max(1, Math.floor(columns));

  const cards: PlacedCard[] = titles.map((title, index) => {
    const row = Math.floor(index / safeColumns);
    const slot = index % safeColumns;
    const column = row % 2 === 0 ? slot : safeColumns - 1 - slot;
    return {
      title,
      index,
      row,
      column,
      x: column * (CARD_WIDTH + GAP_X),
      y: row * (CARD_HEIGHT + GAP_Y),
    };
  });

  const connectors: Connector[] = [];
  for (let i = 0; i < cards.length - 1; i += 1) {
    const from = cards[i];
    const to = cards[i + 1];
    const shared = {
      id: `${from.title.id}->${to.title.id}`,
      fromId: from.title.id,
      toId: to.title.id,
    };

    if (from.row === to.row) {
      const goingRight = to.x > from.x;
      connectors.push({
        ...shared,
        direction: goingRight ? "right" : "left",
        x: Math.min(from.x, to.x) + CARD_WIDTH,
        y: from.y,
        width: GAP_X,
        height: CARD_HEIGHT,
      });
    } else {
      connectors.push({
        ...shared,
        direction: "down",
        x: from.x,
        y: from.y + CARD_HEIGHT,
        width: CARD_WIDTH,
        height: GAP_Y,
      });
    }
  }

  const usedColumns = Math.min(safeColumns, Math.max(cards.length, 1));
  const rows = Math.max(1, Math.ceil(cards.length / safeColumns));

  return {
    cards,
    connectors,
    columns: safeColumns,
    width: usedColumns * (CARD_WIDTH + GAP_X) - GAP_X,
    height: rows * (CARD_HEIGHT + GAP_Y) - GAP_Y,
  };
}

export function columnsForWidth(width: number): number {
  if (width < 560) return 2;
  if (width < 900) return 3;
  if (width < 1280) return 4;
  if (width < 1700) return 5;
  return 6;
}
