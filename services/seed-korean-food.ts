import { storage } from "../storage";
import type { InsertKoreanFood } from "@shared/schema";

// Initial Korean food database with comprehensive information
export const koreanFoodSeedData: InsertKoreanFood[] = [
  {
    nameKorean: "비빔밥",
    nameEnglish: "Bibimbap",
    description: "Mixed rice bowl with seasoned vegetables and meat",
    ingredients: ["rice", "spinach", "bean sprouts", "carrot", "mushrooms", "beef", "egg", "gochujang", "sesame oil"],
    calories: 420,
    category: "Main Dish",
    spiciness: 2,
    allergens: ["soy", "gluten", "egg", "sesame"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "1 bowl (300g)",
    cookingMethod: "Mixed",
    region: "Seoul",
  },
  {
    nameKorean: "김치찌개",
    nameEnglish: "Kimchi Jjigae",
    description: "Spicy fermented cabbage stew with pork and tofu",
    ingredients: ["aged kimchi", "pork belly", "tofu", "onion", "garlic", "gochugaru", "fish sauce", "scallions"],
    calories: 280,
    category: "Soup/Stew",
    spiciness: 4,
    allergens: ["soy", "fish"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "1 bowl (250ml)",
    cookingMethod: "Stewed",
    region: "Nationwide",
  },
  {
    nameKorean: "불고기",
    nameEnglish: "Bulgogi",
    description: "Sweet marinated grilled beef strips",
    ingredients: ["beef", "soy sauce", "pear", "garlic", "ginger", "sesame oil", "sugar", "rice wine"],
    calories: 350,
    category: "Main Dish",
    spiciness: 0,
    allergens: ["soy", "sesame"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "150g meat",
    cookingMethod: "Grilled",
    region: "Seoul",
  },
  {
    nameKorean: "된장찌개",
    nameEnglish: "Doenjang Jjigae",
    description: "Soybean paste stew with vegetables and tofu",
    ingredients: ["doenjang", "tofu", "zucchini", "onion", "mushrooms", "scallions", "garlic", "anchovy broth"],
    calories: 180,
    category: "Soup/Stew",
    spiciness: 1,
    allergens: ["soy", "fish"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "1 bowl (250ml)",
    cookingMethod: "Stewed",
    region: "Nationwide",
  },
  {
    nameKorean: "김밥",
    nameEnglish: "Gimbap",
    description: "Rice rolls wrapped in seasoned seaweed",
    ingredients: ["rice", "seaweed", "pickled radish", "egg", "beef", "spinach", "carrot", "sesame oil"],
    calories: 250,
    category: "Main Dish",
    spiciness: 0,
    allergens: ["soy", "egg", "sesame"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "6-8 pieces",
    cookingMethod: "Rolled",
    region: "Nationwide",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&auto=format",
  },
  {
    nameKorean: "냉면",
    nameEnglish: "Naengmyeon",
    description: "Cold buckwheat noodles in broth.",
    ingredients: ["buckwheat noodles", "beef broth", "cucumber", "pear", "egg", "mustard oil", "vinegar"],
    calories: 320,
    category: "Noodles",
    spiciness: 1,
    allergens: ["gluten", "egg"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "1 bowl",
    cookingMethod: "Boiled",
    region: "North Korea",
    imageUrl: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=400&h=300&fit=crop&auto=format",
  },
  {
    nameKorean: "삼겹살",
    nameEnglish: "Samgyeopsal",
    description: "Grilled pork belly wrapped in lettuce.",
    ingredients: ["pork belly", "lettuce", "garlic", "ssamjang", "scallions", "perilla leaves"],
    calories: 450,
    category: "BBQ",
    spiciness: 0,
    allergens: ["soy"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "200g meat",
    cookingMethod: "Grilled",
    region: "Nationwide",
    imageUrl: "https://images.unsplash.com/photo-1590031905406-f18a426d772d?w=400&h=300&fit=crop&auto=format",
  },
  {
    nameKorean: "잡채",
    nameEnglish: "Japchae",
    description: "Sweet potato noodles with vegetables.",
    ingredients: ["sweet potato noodles", "spinach", "carrot", "mushrooms", "beef", "soy sauce", "sesame oil", "sugar"],
    calories: 290,
    category: "Side Dish",
    spiciness: 0,
    allergens: ["soy", "sesame"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "1 portion (150g)",
    cookingMethod: "Stir-fried",
    region: "Seoul",
    imageUrl: "https://images.unsplash.com/photo-1581061623-a4f3aa1cb3a7?w=400&h=300&fit=crop&auto=format",
  },
  {
    nameKorean: "김치",
    nameEnglish: "Kimchi",
    description: "Spicy fermented cabbage.",
    ingredients: ["napa cabbage", "gochugaru", "garlic", "ginger", "fish sauce", "scallions", "salt"],
    calories: 15,
    category: "Side Dish",
    spiciness: 3,
    allergens: ["fish"],
    isVegetarian: false,
    isVegan: false,
    servingSize: "50g",
    cookingMethod: "Fermented",
    region: "Nationwide",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop&auto=format",
  },
  {
    nameKorean: "호떡",
    nameEnglish: "Hotteok",
    description: "Sweet pancake with brown sugar.",
    ingredients: ["flour", "brown sugar", "honey", "peanuts", "cinnamon", "yeast", "milk"],
    calories: 280,
    category: "Dessert",
    spiciness: 0,
    allergens: ["gluten", "nuts", "milk"],
    isVegetarian: true,
    isVegan: false,
    servingSize: "1 piece",
    cookingMethod: "Pan-fried",
    region: "Nationwide",
    imageUrl: "https://images.unsplash.com/photo-1610218390945-c5c1eb4e0d72?w=400&h=300&fit=crop&auto=format",
  },
];

export async function seedKoreanFoodDatabase() {
  try {
    console.log("Seeding Korean food database...");
    
    for (const foodData of koreanFoodSeedData) {
      // Check if food already exists
      const existing = await storage.findKoreanFood(foodData.nameKorean);
      
      if (!existing) {
        await storage.createKoreanFood(foodData);
        console.log(`Added ${foodData.nameKorean} to database`);
      } else {
        console.log(`${foodData.nameKorean} already exists in database`);
      }
    }
    
    console.log("Korean food database seeding completed!");
  } catch (error) {
    console.error("Error seeding Korean food database:", error);
  }
}