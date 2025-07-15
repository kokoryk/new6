import axios from 'axios';

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description?: string;
  description?: string;
}

interface UnsplashSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

export class UnsplashService {
  private accessKey: string;
  private baseUrl = 'https://api.unsplash.com';

  constructor() {
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      console.warn('UNSPLASH_ACCESS_KEY not provided - Unsplash service will be disabled');
      this.accessKey = '';
      return;
    }
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY;
  }

  async searchKoreanFood(koreanFoodName: string, englishFoodName?: string): Promise<string | null> {
    // First try Korean image sources for more authentic content
    const { koreanImageService } = await import('./korean-image-service');
    const koreanResult = await koreanImageService.searchKoreanFoodImage(koreanFoodName, englishFoodName || koreanFoodName);
    if (koreanResult) {
      return koreanResult;
    }

    // Fallback to Unsplash if Korean sources don't have results
    if (!this.accessKey) {
      console.log('Unsplash service disabled - no access key provided');
      return null;
    }
    
    try {
      // Only search with English names if provided, skip Korean characters
      if (!englishFoodName) {
        console.log(`No English name provided for "${koreanFoodName}", skipping image search`);
        return null;
      }

      // Extract key ingredients and dish types for better search results
      const getSearchTerms = (dishName: string): string[] => {
        const name = dishName.toLowerCase();
        
        // Extract main ingredients/components
        if (name.includes('squid') || name.includes('octopus')) return ['korean squid', 'korean seafood'];
        if (name.includes('shrimp')) return ['korean shrimp', 'korean prawns'];
        if (name.includes('crab')) return ['korean crab', 'soy marinated crab'];
        if (name.includes('chicken')) return ['korean chicken', 'chicken stew'];
        if (name.includes('beef')) return ['korean beef', 'bulgogi'];
        if (name.includes('pork')) return ['korean pork'];
        if (name.includes('fish')) return ['korean fish'];
        if (name.includes('tofu')) return ['korean tofu'];
        
        // Extract dish types
        if (name.includes('stew') || name.includes('soup')) return ['korean stew', 'korean soup'];
        if (name.includes('rice') || name.includes('bibimbap')) return ['korean rice', 'bibimbap'];
        if (name.includes('noodle')) return ['korean noodles'];
        if (name.includes('set') || name.includes('meal')) return ['korean set meal', 'korean banchan'];
        if (name.includes('bbq') || name.includes('grilled')) return ['korean bbq', 'korean grill'];
        
        // Default fallback
        return ['korean food', 'korean cuisine'];
      };

      // Get search terms based on dish name
      const searchTerms = getSearchTerms(englishFoodName);
      
      // Create search queries with extracted terms
      const searchQueries = searchTerms.flatMap(term => [
        `${term} dish`,
        `${term} restaurant`,
        `traditional ${term}`
      ]);
      
      for (const searchQuery of searchQueries) {
        console.log(`Searching Unsplash for: "${searchQuery}" (extracted from: ${englishFoodName})`);

        const response = await axios.get<UnsplashSearchResponse>(
          `${this.baseUrl}/search/photos`,
          {
            params: {
              query: searchQuery,
              per_page: 15,
              orientation: 'landscape',
              content_filter: 'high',
              order_by: 'relevant',
            },
            headers: {
              Authorization: `Client-ID ${this.accessKey}`,
            },
          }
        );

        const images = response.data.results;
        
        if (images.length > 0) {
          // Analyze image relevance with scoring
          const scoredImages = images.map(img => {
            const alt = img.alt_description?.toLowerCase() || '';
            const desc = img.description?.toLowerCase() || '';
            let score = 0;
            
            // High relevance indicators
            if (alt.includes('food') || desc.includes('food')) score += 3;
            if (alt.includes('korean') || desc.includes('korean')) score += 3;
            if (alt.includes('dish') || alt.includes('meal') || alt.includes('cuisine')) score += 2;
            if (alt.includes('restaurant') || alt.includes('cooking')) score += 2;
            
            // Ingredient-specific scoring
            const searchLower = searchQuery.toLowerCase();
            if (searchLower.includes('shrimp') && (alt.includes('shrimp') || alt.includes('prawn'))) score += 4;
            if (searchLower.includes('crab') && alt.includes('crab')) score += 4;
            if (searchLower.includes('squid') && (alt.includes('squid') || alt.includes('octopus'))) score += 4;
            if (searchLower.includes('chicken') && alt.includes('chicken')) score += 4;
            if (searchLower.includes('beef') && alt.includes('beef')) score += 4;
            
            // Negative indicators (non-food related)
            if (alt.includes('person') || alt.includes('people') || alt.includes('man') || alt.includes('woman')) score -= 2;
            if (alt.includes('building') || alt.includes('street') || alt.includes('city')) score -= 2;
            if (alt.includes('nature') || alt.includes('landscape') || alt.includes('sky')) score -= 2;
            
            return { ...img, relevanceScore: score };
          });
          
          // Sort by relevance score
          scoredImages.sort((a, b) => b.relevanceScore - a.relevanceScore);
          
          // Select best image
          const bestImage = scoredImages[0];
          const imageUrl = bestImage.urls.regular;
          
          // Determine accuracy level based on score
          let accuracy = 'high';
          if (bestImage.relevanceScore < 2) accuracy = 'low';
          else if (bestImage.relevanceScore < 4) accuracy = 'medium';
          
          console.log(`Found image for "${searchQuery}" - relevance score: ${bestImage.relevanceScore}, accuracy: ${accuracy}: ${imageUrl}`);
          
          // Return both URL and accuracy indicator
          return `${imageUrl}|${accuracy}`;
        }
      }
      
      console.log(`No images found for any search queries for "${koreanFoodName}"`);
      return null;
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return null;
    }
  }

  async searchGenericKoreanFood(): Promise<string | null> {
    if (!this.accessKey) {
      console.log('Unsplash service disabled - no access key provided');
      return null;
    }
    
    try {
      const response = await axios.get<UnsplashSearchResponse>(
        `${this.baseUrl}/search/photos`,
        {
          params: {
            query: 'korean food traditional cuisine',
            per_page: 10,
            orientation: 'landscape',
            content_filter: 'high',
          },
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
          },
        }
      );

      const images = response.data.results;
      
      if (images.length === 0) {
        return null;
      }

      // Return a random image from the first 5 results
      const randomIndex = Math.floor(Math.random() * Math.min(images.length, 5));
      return images[randomIndex].urls.regular;
    } catch (error) {
      console.error('Error searching generic Korean food:', error);
      return null;
    }
  }
}

export const unsplashService = new UnsplashService();