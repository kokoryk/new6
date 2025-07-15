import {
  users,
  menuAnalyses,
  koreanFoods,
  type User,
  type UpsertUser,
  type MenuAnalysis,
  type InsertMenuAnalysis,
  type KoreanFood,
  type InsertKoreanFood,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and, count, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  incrementUserUsage(userId: string): Promise<void>;
  getUsageCount(userId?: string, sessionId?: string): Promise<number>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>;
  updateUserStripeSubscriptionId(userId: string, stripeSubscriptionId: string): Promise<void>;
  updateUserPremiumStatus(stripeCustomerId: string, isPremium: boolean): Promise<void>;
  
  // Menu analysis operations
  createMenuAnalysis(analysis: InsertMenuAnalysis): Promise<MenuAnalysis>;
  getMenuAnalysis(id: number): Promise<MenuAnalysis | undefined>;
  getRecentMenuAnalyses(limit: number): Promise<MenuAnalysis[]>;
  getCachedAnalysisByImageHash(imageHash: string): Promise<MenuAnalysis | undefined>;
  
  // Korean food database operations
  findKoreanFood(nameKorean: string): Promise<KoreanFood | undefined>;
  findKoreanFoodByEnglishName(nameEnglish: string): Promise<KoreanFood | undefined>;
  searchKoreanFoods(query: string): Promise<KoreanFood[]>;
  createKoreanFood(food: InsertKoreanFood): Promise<KoreanFood>;
  updateKoreanFood(id: number, food: Partial<InsertKoreanFood>): Promise<KoreanFood>;
  getAllKoreanFoods(): Promise<KoreanFood[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async incrementUserUsage(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        freeUsageCount: sql`${users.freeUsageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUsageCount(userId?: string, sessionId?: string): Promise<number> {
    if (userId) {
      // Get user's usage count from user table
      const [user] = await db
        .select({ count: users.freeUsageCount })
        .from(users)
        .where(eq(users.id, userId));
      return user?.count || 0;
    } else if (sessionId) {
      // Count analyses for this session
      const [result] = await db
        .select({ count: count() })
        .from(menuAnalyses)
        .where(eq(menuAnalyses.sessionId, sessionId));
      return result?.count || 0;
    }
    return 0;
  }

  async createMenuAnalysis(analysis: InsertMenuAnalysis): Promise<MenuAnalysis> {
    const [created] = await db
      .insert(menuAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getMenuAnalysis(id: number): Promise<MenuAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(menuAnalyses)
      .where(eq(menuAnalyses.id, id));
    return analysis;
  }

  async getRecentMenuAnalyses(limit: number): Promise<MenuAnalysis[]> {
    return await db
      .select()
      .from(menuAnalyses)
      .orderBy(desc(menuAnalyses.createdAt))
      .limit(limit);
  }

  async getCachedAnalysisByImageHash(imageHash: string): Promise<MenuAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(menuAnalyses)
      .where(eq(menuAnalyses.imageHash, imageHash))
      .orderBy(desc(menuAnalyses.createdAt))
      .limit(1);
    return analysis;
  }

  // Korean food database operations
  async findKoreanFood(nameKorean: string): Promise<KoreanFood | undefined> {
    const [food] = await db
      .select()
      .from(koreanFoods)
      .where(eq(koreanFoods.nameKorean, nameKorean));
    return food;
  }

  async findKoreanFoodByEnglishName(nameEnglish: string): Promise<KoreanFood | undefined> {
    const [food] = await db
      .select()
      .from(koreanFoods)
      .where(eq(koreanFoods.nameEnglish, nameEnglish));
    return food;
  }

  async searchKoreanFoods(query: string): Promise<KoreanFood[]> {
    return await db
      .select()
      .from(koreanFoods)
      .where(
        or(
          ilike(koreanFoods.nameKorean, `%${query}%`),
          ilike(koreanFoods.nameEnglish, `%${query}%`)
        )
      )
      .limit(10);
  }

  async createKoreanFood(food: InsertKoreanFood): Promise<KoreanFood> {
    const [created] = await db
      .insert(koreanFoods)
      .values(food)
      .returning();
    return created;
  }

  async updateKoreanFood(id: number, food: Partial<InsertKoreanFood>): Promise<KoreanFood> {
    const [updated] = await db
      .update(koreanFoods)
      .set({ ...food, updatedAt: new Date() })
      .where(eq(koreanFoods.id, id))
      .returning();
    return updated;
  }

  async getAllKoreanFoods(): Promise<KoreanFood[]> {
    return await db
      .select()
      .from(koreanFoods)
      .orderBy(koreanFoods.nameKorean);
  }

  // Stripe-related methods
  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        stripeCustomerId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserStripeSubscriptionId(userId: string, stripeSubscriptionId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        stripeSubscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserPremiumStatus(stripeCustomerId: string, isPremium: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isPremium,
        updatedAt: new Date() 
      })
      .where(eq(users.stripeCustomerId, stripeCustomerId));
  }
}

export const storage = new DatabaseStorage();
