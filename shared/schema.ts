import { pgTable, text, serial, integer, json, timestamp, boolean, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table for tracking usage and authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  freeUsageCount: integer("free_usage_count").default(0).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Korean food database table
export const koreanFoods = pgTable("korean_foods", {
  id: serial("id").primaryKey(),
  nameKorean: varchar("name_korean", { length: 300 }).notNull(),
  nameEnglish: varchar("name_english", { length: 300 }).notNull(),
  description: text("description").notNull(),
  ingredients: text("ingredients").array().notNull(),
  calories: integer("calories").notNull(),

  category: varchar("category", { length: 100 }),
  spiciness: integer("spiciness").default(0), // 0-5 scale
  allergens: text("allergens").array().default([]),
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  servingSize: varchar("serving_size", { length: 200 }),
  cookingMethod: varchar("cooking_method", { length: 200 }),
  region: varchar("region", { length: 200 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuAnalyses = pgTable("menu_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"), // For anonymous users
  imageUrl: text("image_url").notNull(),
  imageHash: varchar("image_hash", { length: 64 }), // SHA-256 hash for duplicate detection
  extractedFoodNames: text("extracted_food_names").array().notNull(), // OCR extracted names
  detectedDishes: json("detected_dishes").$type<DetectedDish[]>().notNull(),
  isKoreanMenu: boolean("is_korean_menu").notNull(),
  tokenUsage: jsonb("token_usage").$type<{
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    cost_aud: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertKoreanFoodSchema = createInsertSchema(koreanFoods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuAnalysisSchema = createInsertSchema(menuAnalyses).pick({
  userId: true,
  sessionId: true,
  imageUrl: true,
  extractedFoodNames: true,
  detectedDishes: true,
  isKoreanMenu: true,
  tokenUsage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertKoreanFood = z.infer<typeof insertKoreanFoodSchema>;
export type KoreanFood = typeof koreanFoods.$inferSelect;

export type DetectedDish = {
  nameKorean: string;
  nameEnglish: string;
  description: string;
  descriptionEnglish?: string;
  ingredients: string[];
  calories: number;

  category?: string;
  spiciness?: number;
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  servingSize?: string;
  cookingMethod?: string;
  region?: string;
  confidence: number;
  source: 'database' | 'ai'; // Track where the data came from
  imageUrl?: string;
  imageAccuracy?: 'high' | 'medium' | 'low'; // Track image relevance quality
};

export type InsertMenuAnalysis = z.infer<typeof insertMenuAnalysisSchema>;
export type MenuAnalysis = typeof menuAnalyses.$inferSelect;

export const analyzeMenuRequestSchema = z.object({
  imageBase64: z.string(),
});

export type AnalyzeMenuRequest = z.infer<typeof analyzeMenuRequestSchema>;

export const analyzeMenuResponseSchema = z.object({
  id: z.number(),
  isKoreanMenu: z.boolean(),
  dishes: z.array(z.object({
    nameKorean: z.string(),
    nameEnglish: z.string(),
    description: z.string(),
    ingredients: z.array(z.string()).default([]),
    calories: z.number(),
    confidence: z.number(),
    imageUrl: z.string().optional(),
    category: z.string().optional(),
    spiciness: z.number().optional(),
    allergens: z.array(z.string()).optional(),
    isVegetarian: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    servingSize: z.string().optional(),
    cookingMethod: z.string().optional(),
    region: z.string().optional(),
    source: z.enum(['database', 'ai']).optional(),
  })),
  message: z.string().optional(),
  tokenUsage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
    cost_usd: z.number(),
    cost_aud: z.number(),
  }).optional(),
  cached: z.boolean().optional(), // Indicates if result came from cache
  cacheDate: z.date().optional(), // When the cached result was originally created
});

export type AnalyzeMenuResponse = z.infer<typeof analyzeMenuResponseSchema>;
