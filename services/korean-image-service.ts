import axios from 'axios';

interface ImageResult {
  url: string;
  source: 'naver' | 'pexels' | 'pixabay' | 'unsplash';
  accuracy: 'high' | 'medium' | 'low';
  title?: string;
  description?: string;
}

export class KoreanImageService {
  private pexelsApiKey = process.env.PEXELS_API_KEY;
  private pixabayApiKey = process.env.PIXABAY_API_KEY;

  /**
   * Search for Korean food images using multiple sources with robust fallback
   * Priority: Naver -> Pexels -> Pixabay -> Unsplash (fallback)
   */
  async searchKoreanFoodImage(koreanName: string, englishName: string): Promise<string | null> {
    console.log(`🔍 Searching for Korean food images: "${koreanName}" (${englishName})`);

    // Keep track of all attempted URLs for fallback validation
    const attemptedUrls: Array<{url: string, accuracy: string, source: string}> = [];

    try {
      // 1. Try Naver first (best for Korean content)
      const naverResult = await this.searchNaver(koreanName, englishName);
      if (naverResult) {
        attemptedUrls.push({url: naverResult.url, accuracy: naverResult.accuracy, source: 'naver'});
        if (await this.validateImageUrl(naverResult.url)) {
          console.log(`✅ Found image via Naver: ${naverResult.url} (accuracy: ${naverResult.accuracy})`);
          return `${naverResult.url}|${naverResult.accuracy}`;
        }
      }

      // 2. Try Pexels (free, good Korean content)
      const pexelsResult = await this.searchPexels(koreanName, englishName);
      if (pexelsResult) {
        attemptedUrls.push({url: pexelsResult.url, accuracy: pexelsResult.accuracy, source: 'pexels'});
        if (await this.validateImageUrl(pexelsResult.url)) {
          console.log(`✅ Found image via Pexels: ${pexelsResult.url} (accuracy: ${pexelsResult.accuracy})`);
          return `${pexelsResult.url}|${pexelsResult.accuracy}`;
        }
      }

      // 3. Try Pixabay (free, diverse content)
      const pixabayResult = await this.searchPixabay(koreanName, englishName);
      if (pixabayResult) {
        attemptedUrls.push({url: pixabayResult.url, accuracy: pixabayResult.accuracy, source: 'pixabay'});
        if (await this.validateImageUrl(pixabayResult.url)) {
          console.log(`✅ Found image via Pixabay: ${pixabayResult.url} (accuracy: ${pixabayResult.accuracy})`);
          return `${pixabayResult.url}|${pixabayResult.accuracy}`;
        }
      }

      // 4. Try alternative URLs from attempted results
      for (const attempt of attemptedUrls) {
        if (attempt.source === 'naver') {
          // Try alternative Naver URLs with different user agents
          const alternativeUrls = await this.getAlternativeNaverUrls(koreanName, englishName);
          for (const altUrl of alternativeUrls) {
            if (await this.validateImageUrl(altUrl.url)) {
              console.log(`✅ Found alternative Naver image: ${altUrl.url} (accuracy: ${altUrl.accuracy})`);
              return `${altUrl.url}|${altUrl.accuracy}`;
            }
          }
        }
      }

      // 5. Fallback to Unsplash (existing implementation)
      console.log(`ℹ️ All sources failed, falling back to Unsplash for: ${englishName}`);
      return null; // Let existing Unsplash service handle this

    } catch (error) {
      console.error(`❌ Error searching for images: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate if an image URL is accessible through the proxy
   */
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*',
        },
        timeout: 3000,
      });
      
      const contentType = response.headers['content-type'] || '';
      return response.status === 200 && contentType.startsWith('image/');
    } catch (error) {
      console.warn(`⚠️ URL validation failed for ${url}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get alternative Naver URLs with different search strategies
   */
  private async getAlternativeNaverUrls(koreanName: string, englishName: string): Promise<Array<{url: string, accuracy: string}>> {
    const alternatives = [];
    const alternativeQueries = [
      `${koreanName} 레시피`,
      `${koreanName} 만들기`,
      `맛있는 ${koreanName}`,
      `전통 ${koreanName}`,
      `${englishName} recipe korean`,
    ];

    for (const query of alternativeQueries.slice(0, 2)) { // Limit to 2 to avoid too many requests
      try {
        const result = await this.searchNaver(koreanName, englishName, query);
        if (result) {
          alternatives.push({url: result.url, accuracy: result.accuracy});
        }
      } catch (error) {
        continue;
      }
    }

    return alternatives;
  }

  /**
   * Search Naver Images (Korean search engine - best for authentic Korean content)
   */
  private async searchNaver(koreanName: string, englishName: string, customQuery?: string): Promise<ImageResult | null> {
    try {
      // Create multiple Korean search queries for better results
      const queries = customQuery ? [customQuery] : [
        koreanName, // Original Korean name
        `${koreanName} 음식`, // Korean name + food
        `${koreanName} 요리`, // Korean name + dish
        `한국 ${englishName}`, // Korean + English name
        `${englishName} 한국음식`, // English name + Korean food
      ];

      for (const query of queries) {
        try {
          // Use Naver image search (direct scraping approach)
          const encodedQuery = encodeURIComponent(query);
          const searchUrl = `https://s.search.naver.com/p/c/image/search.naver?query=${encodedQuery}&json_type=6&display=20&start=1&_callback=jsonp`;
          
          const response = await axios.get(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            },
            timeout: 5000,
          });

          // Extract JSON from JSONP response
          const jsonpMatch = response.data.match(/jsonp\(({.*?})\)/);
          if (!jsonpMatch) continue;

          const data = JSON.parse(jsonpMatch[1]);
          const items = data.items || [];

          if (items.length > 0) {
            // Score images based on relevance and source authenticity
            const scoredItems = items.map((item: any) => {
              let score = 0;
              const title = item.title?.toLowerCase() || '';
              const source = item.source?.toLowerCase() || '';
              const imageUrl = item.originalUrl || item.thumb || '';
              
              // HIGHEST priority: Korean blog sources (most authentic)
              if (imageUrl.includes('blogfiles.naver.net') || 
                  imageUrl.includes('postfiles.naver.net') ||
                  imageUrl.includes('blog.naver.com')) {
                score += 10; // Highest priority for Korean blogs
              }
              
              // High relevance for food-related content
              if (title.includes('음식') || title.includes('요리') || title.includes('맛집')) score += 3;
              if (title.includes('한국') || title.includes('전통')) score += 2;
              if (source.includes('blog') || source.includes('recipe') || source.includes('restaurant')) score += 2;
              
              // Medium priority for Pinterest (often good food photos but less authentic)
              if (imageUrl.includes('pinimg.com')) score += 1;
              
              // Negative for non-food content
              if (title.includes('사람') || title.includes('건물') || title.includes('풍경')) score -= 2;
              
              return { ...item, relevanceScore: score };
            });

            // Sort by relevance and select best
            scoredItems.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
            const bestItem = scoredItems[0];
            
            if (bestItem.relevanceScore >= 0) {
              let accuracy: 'high' | 'medium' | 'low' = 'high';
              
              // Check if this is from authentic Korean sources and filter out problematic domains
              const imageUrl = bestItem.originalUrl || bestItem.thumb;
              
              // Skip images from domains that often block external access
              if (imageUrl?.includes('shopping.phinf.naver.net') || 
                  imageUrl?.includes('shop1.phinf.naver.net') ||
                  imageUrl?.includes('commerce.') ||
                  imageUrl?.includes('shopping.')) {
                continue; // Skip to next item, these domains often return 403
              }
              
              if (imageUrl?.includes('blogfiles.naver.net') || 
                  imageUrl?.includes('blog.naver.com') ||
                  imageUrl?.includes('postfiles.naver.net')) {
                accuracy = 'high'; // Always high for authentic Korean blog sources
              } else if (bestItem.relevanceScore < 2) {
                accuracy = 'low';
              } else if (bestItem.relevanceScore < 4) {
                accuracy = 'medium';
              }

              return {
                url: bestItem.originalUrl || bestItem.thumb,
                source: 'naver',
                accuracy,
                title: bestItem.title,
                description: `Found via Naver search: ${query}`,
              };
            }
          }
        } catch (queryError) {
          console.warn(`⚠️ Naver search failed for query "${query}": ${queryError.message}`);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Naver search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search Pexels (free API with good Korean content)
   */
  private async searchPexels(koreanName: string, englishName: string): Promise<ImageResult | null> {
    if (!this.pexelsApiKey) {
      console.log('ℹ️ Pexels API key not provided, skipping Pexels search');
      return null;
    }

    try {
      const queries = [
        `korean ${englishName}`,
        `${englishName} korean food`,
        `traditional korean ${englishName}`,
        'korean cuisine',
        'korean food dish',
      ];

      for (const query of queries) {
        try {
          const response = await axios.get('https://api.pexels.com/v1/search', {
            headers: {
              'Authorization': this.pexelsApiKey,
            },
            params: {
              query,
              per_page: 15,
              page: 1,
            },
            timeout: 5000,
          });

          const photos = response.data.photos || [];
          
          if (photos.length > 0) {
            // Score based on alt text and photographer
            const scoredPhotos = photos.map((photo: any) => {
              let score = 0;
              const alt = photo.alt?.toLowerCase() || '';
              const photographer = photo.photographer?.toLowerCase() || '';
              
              if (alt.includes('korean') || alt.includes('korea')) score += 3;
              if (alt.includes('food') || alt.includes('dish') || alt.includes('meal')) score += 2;
              if (alt.includes(englishName.toLowerCase())) score += 4;
              if (photographer.includes('korean') || photographer.includes('asia')) score += 1;
              
              return { ...photo, relevanceScore: score };
            });

            scoredPhotos.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
            const bestPhoto = scoredPhotos[0];

            let accuracy: 'high' | 'medium' | 'low' = 'medium';
            if (bestPhoto.relevanceScore >= 5) accuracy = 'high';
            else if (bestPhoto.relevanceScore < 2) accuracy = 'low';

            return {
              url: bestPhoto.src.large,
              source: 'pexels',
              accuracy,
              title: bestPhoto.alt,
              description: `Found via Pexels: ${query}`,
            };
          }
        } catch (queryError) {
          console.warn(`⚠️ Pexels search failed for query "${query}": ${queryError.message}`);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Pexels search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search Pixabay (free API with diverse content)
   */
  private async searchPixabay(koreanName: string, englishName: string): Promise<ImageResult | null> {
    if (!this.pixabayApiKey) {
      console.log('ℹ️ Pixabay API key not provided, skipping Pixabay search');
      return null;
    }

    try {
      const queries = [
        `korean+${englishName.replace(/ /g, '+')}`,
        `korean+food+${englishName.replace(/ /g, '+')}`,
        'korean+cuisine',
        'korean+traditional+food',
      ];

      for (const query of queries) {
        try {
          const response = await axios.get('https://pixabay.com/api/', {
            params: {
              key: this.pixabayApiKey,
              q: query,
              image_type: 'photo',
              category: 'food',
              per_page: 15,
              safesearch: 'true',
            },
            timeout: 5000,
          });

          const hits = response.data.hits || [];
          
          if (hits.length > 0) {
            // Score based on tags and relevance
            const scoredHits = hits.map((hit: any) => {
              let score = 0;
              const tags = hit.tags?.toLowerCase() || '';
              
              if (tags.includes('korean') || tags.includes('korea')) score += 3;
              if (tags.includes('food') || tags.includes('dish') || tags.includes('cuisine')) score += 2;
              if (tags.includes(englishName.toLowerCase())) score += 4;
              if (tags.includes('traditional') || tags.includes('authentic')) score += 1;
              
              return { ...hit, relevanceScore: score };
            });

            scoredHits.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
            const bestHit = scoredHits[0];

            let accuracy: 'high' | 'medium' | 'low' = 'medium';
            if (bestHit.relevanceScore >= 5) accuracy = 'high';
            else if (bestHit.relevanceScore < 2) accuracy = 'low';

            return {
              url: bestHit.largeImageURL || bestHit.webformatURL,
              source: 'pixabay',
              accuracy,
              title: bestHit.tags,
              description: `Found via Pixabay: ${query}`,
            };
          }
        } catch (queryError) {
          console.warn(`⚠️ Pixabay search failed for query "${query}": ${queryError.message}`);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Pixabay search failed: ${error.message}`);
      return null;
    }
  }
}

export const koreanImageService = new KoreanImageService();