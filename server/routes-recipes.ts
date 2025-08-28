import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Extend Express Request type to include Replit Auth claims
declare global {
  namespace Express {
    interface User {
      claims: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
      access_token: string;
      refresh_token?: string;
      expires_at: number;
    }
  }
}

export function registerRecipeRoutes(app: Express) {
  // ==== RECIPE CRUD OPERATIONS ====
  
  // Get all recipes with filtering
  app.get("/api/recipes", async (req, res) => {
    try {
      const { category, cuisine, difficulty, isPremium, search, limit = 20 } = req.query;
      
      if (search) {
        const recipes = await storage.searchRecipes(search as string, {
          category: category as string,
          cuisine: cuisine as string,
          difficulty: difficulty as string,
          isPremium: isPremium === 'true'
        });
        return res.json(recipes);
      }
      
      let recipes;
      if (category) {
        recipes = await storage.getRecipesByCategory(category as string);
      } else if (cuisine) {
        recipes = await storage.getRecipesByCuisine(cuisine as string);
      } else if (difficulty) {
        recipes = await storage.getRecipesByDifficulty(difficulty as string);
      } else {
        recipes = await storage.getRecipes(isPremium === 'true', parseInt(limit as string));
      }
      
      res.json(recipes);
    } catch (error) {
      console.error("Error getting recipes:", error);
      res.status(500).json({ message: "Failed to get recipes" });
    }
  });

  // Get single recipe by ID
  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipeById(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Error getting recipe:", error);
      res.status(500).json({ message: "Failed to get recipe" });
    }
  });

  // Create new recipe (authenticated)
  app.post("/api/recipes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const recipeData = {
        ...req.body,
        createdBy: userId,
        totalTime: (req.body.prepTime || 0) + (req.body.cookTime || 0)
      };
      
      const recipe = await storage.createRecipe(recipeData);
      
      // Record the creation action
      await storage.recordRecipeAction({
        userId,
        recipeId: recipe.id,
        action: 'created'
      });
      
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Update recipe (authenticated)
  app.put("/api/recipes/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Check if user owns the recipe or is admin
      const existingRecipe = await storage.getRecipeById(id);
      if (!existingRecipe || (existingRecipe.createdBy !== userId)) {
        return res.status(403).json({ message: "Unauthorized to edit this recipe" });
      }
      
      const updateData = {
        ...req.body,
        totalTime: (req.body.prepTime || 0) + (req.body.cookTime || 0)
      };
      
      const recipe = await storage.updateRecipe(id, updateData);
      res.json(recipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  // Delete recipe (authenticated)
  app.delete("/api/recipes/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Check if user owns the recipe
      const existingRecipe = await storage.getRecipeById(id);
      if (!existingRecipe || (existingRecipe.createdBy !== userId)) {
        return res.status(403).json({ message: "Unauthorized to delete this recipe" });
      }
      
      await storage.deleteRecipe(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // ==== RECIPE FAVORITES/SAVED RECIPES ====
  
  // Get user's saved recipes
  app.get("/api/recipes/saved", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const savedRecipes = await storage.getUserSavedRecipes(userId);
      res.json(savedRecipes);
    } catch (error) {
      console.error("Error getting saved recipes:", error);
      res.status(500).json({ message: "Failed to get saved recipes" });
    }
  });

  // Save a recipe
  app.post("/api/recipes/:id/save", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const { notes } = req.body;
      
      const savedRecipe = await storage.saveRecipe(userId, id, notes);
      
      // Record the save action
      await storage.recordRecipeAction({
        userId,
        recipeId: id,
        action: 'saved'
      });
      
      res.status(201).json(savedRecipe);
    } catch (error) {
      console.error("Error saving recipe:", error);
      res.status(500).json({ message: "Failed to save recipe" });
    }
  });

  // Unsave a recipe
  app.delete("/api/recipes/:id/save", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      await storage.unsaveRecipe(userId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      res.status(500).json({ message: "Failed to unsave recipe" });
    }
  });

  // Check if recipe is saved
  app.get("/api/recipes/:id/saved", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const isSaved = await storage.isRecipeSaved(userId, id);
      res.json({ isSaved });
    } catch (error) {
      console.error("Error checking if recipe is saved:", error);
      res.status(500).json({ message: "Failed to check save status" });
    }
  });

  // ==== RECIPE COLLECTIONS ====
  
  // Get user's recipe collections
  app.get("/api/collections", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const collections = await storage.getUserRecipeCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error getting collections:", error);
      res.status(500).json({ message: "Failed to get collections" });
    }
  });

  // Create new collection
  app.post("/api/collections", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const collectionData = { ...req.body, userId };
      
      const collection = await storage.createRecipeCollection(collectionData);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  // Update collection
  app.put("/api/collections/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify ownership
      const collections = await storage.getUserRecipeCollections(userId);
      if (!collections.find(c => c.id === id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const collection = await storage.updateRecipeCollection(id, req.body);
      res.json(collection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  // Delete collection
  app.delete("/api/collections/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify ownership
      const collections = await storage.getUserRecipeCollections(userId);
      if (!collections.find(c => c.id === id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteRecipeCollection(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Get recipes in collection
  app.get("/api/collections/:id/recipes", async (req, res) => {
    try {
      const { id } = req.params;
      const recipes = await storage.getRecipesInCollection(id);
      res.json(recipes);
    } catch (error) {
      console.error("Error getting collection recipes:", error);
      res.status(500).json({ message: "Failed to get collection recipes" });
    }
  });

  // Add recipe to collection
  app.post("/api/collections/:collectionId/recipes/:recipeId", isAuthenticated, async (req, res) => {
    try {
      const { collectionId, recipeId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify collection ownership
      const collections = await storage.getUserRecipeCollections(userId);
      if (!collections.find(c => c.id === collectionId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const collectionRecipe = await storage.addRecipeToCollection(collectionId, recipeId);
      res.status(201).json(collectionRecipe);
    } catch (error) {
      console.error("Error adding recipe to collection:", error);
      res.status(500).json({ message: "Failed to add recipe to collection" });
    }
  });

  // Remove recipe from collection
  app.delete("/api/collections/:collectionId/recipes/:recipeId", isAuthenticated, async (req, res) => {
    try {
      const { collectionId, recipeId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify collection ownership
      const collections = await storage.getUserRecipeCollections(userId);
      if (!collections.find(c => c.id === collectionId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.removeRecipeFromCollection(collectionId, recipeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing recipe from collection:", error);
      res.status(500).json({ message: "Failed to remove recipe from collection" });
    }
  });

  // ==== RECIPE RATINGS AND REVIEWS ====
  
  // Get recipe ratings
  app.get("/api/recipes/:id/ratings", async (req, res) => {
    try {
      const { id } = req.params;
      const ratings = await storage.getRecipeRatings(id);
      const averageRating = await storage.getRecipeAverageRating(id);
      
      res.json({
        ratings,
        average: averageRating.average,
        count: averageRating.count
      });
    } catch (error) {
      console.error("Error getting recipe ratings:", error);
      res.status(500).json({ message: "Failed to get recipe ratings" });
    }
  });

  // Create or update rating
  app.post("/api/recipes/:id/ratings", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Check if user already rated this recipe
      const existingRating = await storage.getUserRecipeRating(userId, id);
      
      if (existingRating) {
        // Update existing rating
        const updatedRating = await storage.updateRecipeRating(existingRating.id, req.body);
        res.json(updatedRating);
      } else {
        // Create new rating
        const ratingData = { ...req.body, userId, recipeId: id };
        const rating = await storage.createRecipeRating(ratingData);
        res.status(201).json(rating);
      }
    } catch (error) {
      console.error("Error creating/updating rating:", error);
      res.status(500).json({ message: "Failed to create/update rating" });
    }
  });

  // ==== RECIPE COMMENTS ====
  
  // Get recipe comments
  app.get("/api/recipes/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getRecipeComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Error getting recipe comments:", error);
      res.status(500).json({ message: "Failed to get recipe comments" });
    }
  });

  // Create comment
  app.post("/api/recipes/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const commentData = { ...req.body, userId, recipeId: id };
      
      const comment = await storage.createRecipeComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Update comment
  app.put("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Get comment to verify ownership
      const comments = await storage.getRecipeComments(''); // This needs improvement
      const comment = comments.find(c => c.id === id && c.userId === userId);
      
      if (!comment) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedComment = await storage.updateRecipeComment(id, req.body);
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  // Delete comment
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Similar verification needed here
      await storage.deleteRecipeComment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ==== SHOPPING LISTS ====
  
  // Get user's shopping lists
  app.get("/api/shopping-lists", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const shoppingLists = await storage.getUserShoppingLists(userId);
      res.json(shoppingLists);
    } catch (error) {
      console.error("Error getting shopping lists:", error);
      res.status(500).json({ message: "Failed to get shopping lists" });
    }
  });

  // Create shopping list
  app.post("/api/shopping-lists", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const shoppingListData = { ...req.body, userId };
      
      const shoppingList = await storage.createShoppingList(shoppingListData);
      res.status(201).json(shoppingList);
    } catch (error) {
      console.error("Error creating shopping list:", error);
      res.status(500).json({ message: "Failed to create shopping list" });
    }
  });

  // Get shopping list items
  app.get("/api/shopping-lists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getShoppingListItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error getting shopping list items:", error);
      res.status(500).json({ message: "Failed to get shopping list items" });
    }
  });

  // Add recipe to shopping list
  app.post("/api/shopping-lists/:id/recipes/:recipeId", isAuthenticated, async (req, res) => {
    try {
      const { id, recipeId } = req.params;
      const items = await storage.addRecipeToShoppingList(id, recipeId);
      res.status(201).json(items);
    } catch (error) {
      console.error("Error adding recipe to shopping list:", error);
      res.status(500).json({ message: "Failed to add recipe to shopping list" });
    }
  });

  // ==== MEAL PLANNING ====
  
  // Get user's meal plans
  app.get("/api/meal-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const mealPlans = await storage.getUserMealPlans(userId);
      res.json(mealPlans);
    } catch (error) {
      console.error("Error getting meal plans:", error);
      res.status(500).json({ message: "Failed to get meal plans" });
    }
  });

  // Create meal plan
  app.post("/api/meal-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const mealPlanData = { ...req.body, userId };
      
      const mealPlan = await storage.createMealPlan(mealPlanData);
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      res.status(500).json({ message: "Failed to create meal plan" });
    }
  });

  // Get planned meals for date
  app.get("/api/planned-meals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter required" });
      }
      
      const plannedMeals = await storage.getPlannedMealsForDate(userId, new Date(date as string));
      res.json(plannedMeals);
    } catch (error) {
      console.error("Error getting planned meals:", error);
      res.status(500).json({ message: "Failed to get planned meals" });
    }
  });

  // ==== COOKING TIMERS ====
  
  // Get user's active timers
  app.get("/api/timers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const timers = await storage.getUserActiveTimers(userId);
      res.json(timers);
    } catch (error) {
      console.error("Error getting timers:", error);
      res.status(500).json({ message: "Failed to get timers" });
    }
  });

  // Create cooking timer
  app.post("/api/timers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const timerData = { ...req.body, userId };
      
      const timer = await storage.createCookingTimer(timerData);
      res.status(201).json(timer);
    } catch (error) {
      console.error("Error creating timer:", error);
      res.status(500).json({ message: "Failed to create timer" });
    }
  });

  // Update timer
  app.put("/api/timers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const timer = await storage.updateCookingTimer(id, req.body);
      res.json(timer);
    } catch (error) {
      console.error("Error updating timer:", error);
      res.status(500).json({ message: "Failed to update timer" });
    }
  });

  // ==== RECIPE HISTORY ====
  
  // Get user's recipe history
  app.get("/api/recipe-history", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { limit = 50 } = req.query;
      
      const history = await storage.getUserRecipeHistory(userId, parseInt(limit as string));
      res.json(history);
    } catch (error) {
      console.error("Error getting recipe history:", error);
      res.status(500).json({ message: "Failed to get recipe history" });
    }
  });

  // Get recently viewed recipes
  app.get("/api/recipes/recently-viewed", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { limit = 10 } = req.query;
      
      const recipes = await storage.getRecentlyViewedRecipes(userId, parseInt(limit as string));
      res.json(recipes);
    } catch (error) {
      console.error("Error getting recently viewed recipes:", error);
      res.status(500).json({ message: "Failed to get recently viewed recipes" });
    }
  });

  // Record recipe view
  app.post("/api/recipes/:id/view", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      await storage.recordRecipeAction({
        userId,
        recipeId: id,
        action: 'viewed'
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error recording recipe view:", error);
      res.status(500).json({ message: "Failed to record recipe view" });
    }
  });

  // ==== INGREDIENT SUBSTITUTIONS ====
  
  // Get substitutions for ingredient
  app.get("/api/substitutions/:ingredient", async (req, res) => {
    try {
      const { ingredient } = req.params;
      const substitutions = await storage.getIngredientSubstitutions(ingredient);
      res.json(substitutions);
    } catch (error) {
      console.error("Error getting substitutions:", error);
      res.status(500).json({ message: "Failed to get substitutions" });
    }
  });
}