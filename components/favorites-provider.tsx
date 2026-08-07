"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "camisfutmadrid:favorites:v1";

type FavoritesContextValue = {
  favoriteIds: string[];
  favoriteCount: number;
  hydrated: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        setFavoriteIds(
          parsed.filter((value): value is string => typeof value === "string")
        );
      }
    } catch {
      setFavoriteIds([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, hydrated]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [productId, ...current]
    );
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  const value = useMemo(
    () => ({
      favoriteIds,
      favoriteCount: favoriteIds.length,
      hydrated,
      isFavorite,
      toggleFavorite,
      clearFavorites,
    }),
    [
      favoriteIds,
      hydrated,
      isFavorite,
      toggleFavorite,
      clearFavorites,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites debe usarse dentro de FavoritesProvider."
    );
  }

  return context;
}
