import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { ActorId, CharacterId } from "@/domain/entities/title";
import { isSpotlightActive, type Spotlight } from "@/domain/services/spotlight";
import {
  isStudioFilter,
  type StudioFilter,
} from "@/domain/services/studio-filter";
import { isTypeFilter, type TypeFilter } from "@/domain/services/type-filter";
import { spotlightStorage } from "../storage/spotlight-storage";

const CHARACTER = "c";
const ACTOR = "a";
const STUDIO = "studio";
const TYPE = "type";

export function useSpotlight({ persist = false }: { persist?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const characterId: CharacterId | null = searchParams.get(CHARACTER) || null;
  const actorId: ActorId | null = searchParams.get(ACTOR) || null;
  const rawStudio = searchParams.get(STUDIO);
  const rawType = searchParams.get(TYPE);

  const spotlight: Spotlight = useMemo(
    () => ({
      characterId,
      actorId,
      studio: isStudioFilter(rawStudio) ? rawStudio : "all",
      type: isTypeFilter(rawType) ? rawType : "all",
    }),
    [characterId, actorId, rawStudio, rawType],
  );

  const patch = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          mutate(next);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const restored = useRef(!persist);
  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      if (!characterId && !actorId) {
        const saved = spotlightStorage.read();
        if (saved) {
          patch((params) =>
            params.set(saved.lens === "actor" ? ACTOR : CHARACTER, saved.id),
          );
          return;
        }
      }
    }
    if (!persist) return;
    spotlightStorage.write(
      actorId
        ? { lens: "actor", id: actorId }
        : characterId
          ? { lens: "character", id: characterId }
          : null,
    );
  }, [persist, characterId, actorId, patch]);

  const setCharacter = useCallback(
    (id: CharacterId | null) =>
      patch((params) => {
        params.delete(ACTOR);
        if (id) params.set(CHARACTER, id);
        else params.delete(CHARACTER);
      }),
    [patch],
  );

  const setActor = useCallback(
    (id: ActorId | null) =>
      patch((params) => {
        params.delete(CHARACTER);
        if (id) params.set(ACTOR, id);
        else params.delete(ACTOR);
      }),
    [patch],
  );

  const setStudio = useCallback(
    (value: StudioFilter) =>
      patch((params) =>
        value === "all" ? params.delete(STUDIO) : params.set(STUDIO, value),
      ),
    [patch],
  );

  const setType = useCallback(
    (value: TypeFilter) =>
      patch((params) =>
        value === "all" ? params.delete(TYPE) : params.set(TYPE, value),
      ),
    [patch],
  );

  const clear = useCallback(
    () =>
      patch((params) => {
        params.delete(CHARACTER);
        params.delete(ACTOR);
        params.delete(STUDIO);
        params.delete(TYPE);
      }),
    [patch],
  );

  return {
    spotlight,
    setCharacter,
    setActor,
    setStudio,
    setType,
    clear,
    isActive: isSpotlightActive(spotlight),
  };
}
