import { create } from 'zustand'
import type { Recipe } from '@/shared/types'
import { getAllRecipes, putRecipe, deleteRecipeFromDb } from '@/shared/lib/db'
interface RecipeState { recipes: Recipe[]; selectedRecipeId: string | null; hydrate: () => void; addRecipe: (title: string, ingredients: string[], instructions: string, calories: number, protein: number, carbs: number) => void; deleteRecipe: (id: string) => void; toggleFavorite: (id: string) => void; selectRecipe: (id: string | null) => void }
export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [], selectedRecipeId: null,
  hydrate: () => { getAllRecipes().then((recipes) => set({ recipes })) },
  addRecipe: (title, ingredients, instructions, calories, protein, carbs) => { const r: Recipe = { id: crypto.randomUUID(), title, ingredients, instructions, calories, protein, carbs, isFavorite: false, createdAt: new Date().toISOString() }; set((s) => ({ recipes: [r, ...s.recipes] })); putRecipe(r) },
  deleteRecipe: (id) => { set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id), selectedRecipeId: s.selectedRecipeId === id ? null : s.selectedRecipeId })); deleteRecipeFromDb(id) },
  toggleFavorite: (id) => { set((s) => ({ recipes: s.recipes.map((r) => { if (r.id !== id) return r; const u = { ...r, isFavorite: !r.isFavorite }; putRecipe(u); return u }) })) },
  selectRecipe: (id) => set({ selectedRecipeId: id }),
}))
