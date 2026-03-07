import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRecipeStore } from '../recipe.store'
vi.mock('@/shared/lib/db', () => ({ getAllRecipes: vi.fn().mockResolvedValue([]), putRecipe: vi.fn().mockResolvedValue(undefined), deleteRecipeFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('RecipeStore', () => {
  beforeEach(() => { useRecipeStore.setState({ recipes: [], selectedRecipeId: null }) })
  it('should add recipe', () => { useRecipeStore.getState().addRecipe('Pasta', ['pasta','sauce'], 'Boil and mix', 450, 15, 60); expect(useRecipeStore.getState().recipes).toHaveLength(1) })
  it('should toggle favorite', () => { useRecipeStore.getState().addRecipe('R', [], '', 0, 0, 0); useRecipeStore.getState().toggleFavorite(useRecipeStore.getState().recipes[0].id); expect(useRecipeStore.getState().recipes[0].isFavorite).toBe(true) })
  it('should delete recipe', () => { useRecipeStore.getState().addRecipe('R', [], '', 0, 0, 0); useRecipeStore.getState().deleteRecipe(useRecipeStore.getState().recipes[0].id); expect(useRecipeStore.getState().recipes).toHaveLength(0) })
})
