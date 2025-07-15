// Backend-only routes for Render deployment
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { nanoid } from "nanoid";
import CryptoJS from "crypto-js";
import { analyzeKoreanMenu } from "./services/openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  analyzeMenuRequestSchema, 
  type AnalyzeMenuResponse 
} from "./shared/schema";
import { isUsageLimitError, isFoodLimitError } from "./lib/errorUtils";

// Initialize Stripe
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Robust image proxy endpoint with fallback system
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'Image URL is required' });
      }

      // Extended allowed domains list
      const allowedDomains = [
        'blogfiles.naver.net',
        'postfiles.naver.net',
        'phinf.naver.net',
        'blog.naver.com',
        'cafe.naver.com',
        'images.unsplash.com',
        'images.pexels.com',
        'cdn.pixabay.com',
        'i.pinimg.com',
        'pinimg.com',
        's.pinimg.com',
        'media.pinimg.com'
      ];

      const imageUrl = new URL(url);
      const isAllowed = allowedDomains.some(domain => 
        imageUrl.hostname === domain || imageUrl.hostname.endsWith('.' + domain)
      );
      if (!isAllowed) {
        console.log(`🚫 Domain blocked: ${imageUrl.hostname}`);
        return res.status(403).json({ message: 'Domain not allowed' });
      }

      // Multiple retry attempts with different configurations
      const retryConfigs = [
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Referer': 'https://www.naver.com/',
            'Cache-Control': 'no-cache',
          },
          timeout: 8000,
        },
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/*',
            'Referer': 'https://www.google.com/',
          },
          timeout: 10000,
        },
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': '*/*',
          },
          timeout: 12000,
        }
      ];

      let lastError;
      for (const [index, config] of retryConfigs.entries()) {
        try {
          console.log(`🔄 Attempt ${index + 1} fetching: ${imageUrl.hostname}`);
          
          const response = await fetch(url, config);
          
          if (!response.ok) {
            lastError = `HTTP ${response.status}: ${response.statusText}`;
            console.warn(`⚠️ Attempt ${index + 1} failed: ${lastError}`);
            continue;
          }

          // Verify content type
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          if (!contentType.startsWith('image/')) {
            lastError = `Invalid content type: ${contentType}`;
            console.warn(`⚠️ Attempt ${index + 1} failed: ${lastError}`);
            continue;
          }

          // Success - stream the image
          console.log(`✅ Successfully fetched image from ${imageUrl.hostname}`);
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('X-Image-Source', imageUrl.hostname);

          const imageBuffer = await response.arrayBuffer();
          return res.send(Buffer.from(imageBuffer));

        } catch (fetchError) {
          lastError = fetchError.message;
          console.warn(`⚠️ Attempt ${index + 1} failed: ${lastError}`);
          
          // Small delay before retry
          if (index < retryConfigs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500 * (index + 1)));
          }
        }
      }

      // All attempts failed
      console.error(`❌ All attempts failed for ${imageUrl.hostname}. Last error: ${lastError}`);
      return res.status(404).json({ 
        message: 'Image not accessible',
        hostname: imageUrl.hostname,
        error: lastError 
      });

    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.status(500).json({ message: 'Failed to load image' });
    }
  });

  // Usage tracking middleware
  const checkUsageLimit = async (req: any, res: any, next: any) => {
    try {
      let userId: string | undefined;
      let sessionId: string | undefined;

      // Check if user is authenticated
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        // For anonymous users, use session ID
        sessionId = req.sessionID || nanoid();
        req.sessionID = sessionId;
      }

      // Get current usage count
      const usageCount = await storage.getUsageCount(userId, sessionId);
      
      console.log(`Usage check - userId: ${userId}, sessionId: ${sessionId}, count: ${usageCount}`);

      // Admin user bypass (your user ID)
      const adminUserId = "44879184"; // Your user ID for unlimited access
      
      // Check if user has exceeded free limit (3 uses for regular users)
      if (usageCount >= 3 && userId !== adminUserId) {
        if (!userId) {
          // Anonymous user exceeded limit
          return res.status(402).json({
            message: "USAGE_LIMIT_ERROR: Free trial limit reached (3 uploads). Please log in and choose from Day Pass ($0.99), Weekly ($3.49), Monthly ($6.99), or Annual ($59.99) plans.",
            usageCount,
            isLimitReached: true,
            requiresAuth: true
          });
        } else {
          // Authenticated user - check if they have premium
          const user = await storage.getUser(userId);
          if (!user?.isPremium) {
            return res.status(402).json({
              message: "USAGE_LIMIT_ERROR: Free limit reached (3 uploads). Choose from Day Pass ($0.99), Weekly ($3.49), Monthly ($6.99), or Annual ($59.99) to continue analyzing Korean menus.",
              usageCount,
              isLimitReached: true,
              requiresPayment: true
            });
          }
        }
      }

      // Store user/session info for later use
      req.analysisContext = { userId, sessionId, usageCount };
      next();
    } catch (error) {
      console.error("Error checking usage limit:", error);
      res.status(500).json({ message: "Failed to check usage limit" });
    }
  };
  
  // Analyze menu endpoint with usage limit check
  app.post("/api/analyze-menu", upload.single("image"), checkUsageLimit, async (req: any, res) => {
    try {
      console.log("Received upload request:", {
        hasFile: !!req.file,
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
        fileFieldname: req.file?.fieldname,
        fileSize: req.file?.size
      });

      let imageBase64: string;

      if (req.file) {
        // Handle file upload
        console.log("Processing file upload:", req.file.originalname, req.file.size, "bytes");
        imageBase64 = req.file.buffer.toString('base64');
      } else if (req.body.imageBase64) {
        // Handle base64 string
        const validation = analyzeMenuRequestSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ 
            message: "Invalid request format",
            errors: validation.error.issues 
          });
        }
        imageBase64 = validation.data.imageBase64;
      } else {
        console.log("No image found in request");
        return res.status(400).json({ 
          message: "No image provided. Please upload an image file or provide base64 data." 
        });
      }

      // Generate image hash for caching
      const imageHash = CryptoJS.SHA256(imageBase64).toString();
      
      // Check if we have a cached analysis for this exact image
      const cachedAnalysis = await storage.getCachedAnalysisByImageHash(imageHash);
      
      if (cachedAnalysis) {
        console.log(`🎯 Cache hit! Using cached analysis for image hash: ${imageHash.substring(0, 16)}...`);
        
        // Increment usage count even for cached results
        const { userId, sessionId } = req.analysisContext;
        if (userId) {
          await storage.incrementUserUsage(userId);
        }
        
        // Return cached result
        const response: AnalyzeMenuResponse = {
          id: cachedAnalysis.id,
          isKoreanMenu: cachedAnalysis.isKoreanMenu,
          dishes: cachedAnalysis.detectedDishes,
          extractedFoodNames: cachedAnalysis.extractedFoodNames,
          tokenUsage: cachedAnalysis.tokenUsage,
          cached: true, // Indicate this was from cache
          cacheDate: cachedAnalysis.createdAt
        };
        
        return res.json(response);
      }

      console.log(`🔍 Cache miss. Processing new image hash: ${imageHash.substring(0, 16)}...`);

      // Use hybrid analysis system (OCR + Database + AI fallback)
      try {
        const analysis = await analyzeKoreanMenu(imageBase64);
        const { userId, sessionId } = req.analysisContext;

        // Create a temporary URL for the uploaded image (in production, you'd upload to cloud storage)
        const imageUrl = `data:image/jpeg;base64,${imageBase64.substring(0, 100)}...`;

        // Save analysis to database with image hash
        const menuAnalysis = await storage.createMenuAnalysis({
          userId,
          sessionId: userId ? undefined : sessionId,
          imageUrl,
          imageHash, // Store the hash for future cache lookups
          extractedFoodNames: analysis.dishes.map(dish => dish.nameKorean),
          detectedDishes: analysis.dishes,
          isKoreanMenu: analysis.isKoreanMenu,
          tokenUsage: analysis.tokenUsage,
        });

        // Increment usage count for the user ONLY after successful analysis
        if (userId) {
          await storage.incrementUserUsage(userId);
        }

        const response: AnalyzeMenuResponse = {
          id: menuAnalysis.id,
          isKoreanMenu: analysis.isKoreanMenu,
          dishes: analysis.dishes.map(dish => ({
            nameKorean: dish.nameKorean,
            nameEnglish: dish.nameEnglish,
            description: dish.description,
            descriptionEnglish: dish.descriptionEnglish,
            ingredients: dish.ingredients || [],
            calories: dish.calories,
            confidence: dish.confidence,
            imageUrl: dish.imageUrl,
            category: dish.category,
            spiciness: dish.spiciness,
            allergens: dish.allergens || [],
            isVegetarian: dish.isVegetarian,
            isVegan: dish.isVegan,
            servingSize: dish.servingSize,
            cookingMethod: dish.cookingMethod,
            region: dish.region,
            source: dish.source,
          })),
          message: analysis.isKoreanMenu 
            ? `Found ${analysis.dishes.length} Korean dishes in the menu` 
            : "This doesn't appear to be a Korean menu",
          tokenUsage: analysis.tokenUsage,
        };

        res.json(response);
      } catch (analysisError: any) {
        // Check if it's a food limit error
        if (analysisError.message && analysisError.message.includes('FOOD_LIMIT_ERROR:')) {
          return res.status(400).json({ 
            message: analysisError.message.replace('FOOD_LIMIT_ERROR: ', ''),
            isLimitError: true 
          });
        }
        throw analysisError; // Re-throw other analysis errors
      }

    } catch (error) {
      console.error("Error analyzing menu:", error);
      res.status(500).json({ 
        message: "Failed to analyze menu. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get recent analyses endpoint
  app.get("/api/recent-analyses", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getRecentMenuAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching recent analyses:", error);
      res.status(500).json({ 
        message: "Failed to fetch recent analyses" 
      });
    }
  });

  // Stripe payment endpoint for multiple plans
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Create subscription endpoint hit");
      console.log("User session:", req.user);
      console.log("Request body:", req.body);
      
      const userId = req.user.claims.sub;
      const { plan } = req.body;
      const user = await storage.getUser(userId);
      
      console.log("Found user:", user);
      
      if (!user?.email) {
        return res.status(400).json({ message: 'User email required for subscription' });
      }

      // Live Price mapping for different plans
      const priceMap = {
        day: 'price_1Rl1SWBVDO5cdN7QavBCVI6G',     // $0.99 day pass (LIVE)
        weekly: 'price_1Rl1SDBVDO5cdN7QvvnTl8x7',  // $3.49/week (LIVE)
        monthly: 'price_1Rl1RfBVDO5cdN7QWxnayy6j', // $6.99/month (LIVE)
        annual: 'price_1Rl1R0BVDO5cdN7QY3P9ztbL'   // $49.99/year (LIVE)
      };

      const priceId = priceMap[plan as keyof typeof priceMap];
      if (!priceId) {
        return res.status(400).json({ message: 'Invalid plan selected' });
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
      }

      if (plan === 'day') {
        // For day pass, create a one-time payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 99, // $0.99 in cents
          currency: 'usd',
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          metadata: { 
            userId,
            plan: 'day-pass',
            type: 'day-pass'
          }
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          type: 'payment_intent'
        });
      } else {
        // For recurring plans, create subscription with auto-renewal disabled
        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { 
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['card']
          },
          cancel_at_period_end: true, // Disable auto-renewal
          expand: ['latest_invoice.payment_intent'],
          metadata: { userId, plan }
        });

        // Update user with subscription ID
        await storage.updateUserStripeSubscriptionId(userId, subscription.id);

        const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
          type: 'subscription'
        });
      }

    } catch (error: any) {
      console.error('Payment creation error:', error);
      res.status(500).json({ message: 'Failed to create payment: ' + error.message });
    }
  });

  // Stripe webhook to handle payment confirmations
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature for security
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        // For development without webhook secret
        event = req.body;
        console.warn('⚠️ Webhook signature verification skipped - add STRIPE_WEBHOOK_SECRET for production');
      }
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('🎯 Received webhook event:', event.type);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Handle day pass payment
          const paymentIntent = event.data.object;
          console.log('💳 Payment succeeded:', paymentIntent.id, paymentIntent.metadata);
          
          if (paymentIntent.metadata?.type === 'day-pass') {
            const userId = paymentIntent.metadata.userId;
            if (userId) {
              console.log(`✅ Activating day pass for user ${userId}`);
              await storage.updateUserPremiumStatus(paymentIntent.customer, true);
              console.log(`✅ Day pass activated for user ${userId}`);
            }
          }
          break;
          
        case 'invoice.payment_succeeded':
          // Handle subscription payment
          const invoice = event.data.object;
          console.log('📄 Invoice payment succeeded:', invoice.id);
          console.log('📄 Invoice customer:', invoice.customer);
          console.log('📄 Invoice subscription:', invoice.subscription);
          
          if (invoice.subscription) {
            console.log(`✅ Activating subscription for customer ${invoice.customer}`);
            await storage.updateUserPremiumStatus(invoice.customer, true);
            console.log(`✅ Subscription activated for customer ${invoice.customer}`);
          } else {
            console.log('❌ No subscription found in invoice object');
            // Try to activate anyway if customer exists
            if (invoice.customer) {
              console.log(`🔄 Attempting to activate premium for customer ${invoice.customer} without subscription check`);
              await storage.updateUserPremiumStatus(invoice.customer, true);
              console.log(`✅ Premium activated for customer ${invoice.customer}`);
            }
          }
          break;
          
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          console.log('❌ Invoice payment failed:', failedInvoice.id);
          await storage.updateUserPremiumStatus(failedInvoice.customer, false);
          console.log(`❌ Premium access revoked for customer ${failedInvoice.customer}`);
          break;
          
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          console.log('🗑️ Subscription cancelled:', subscription.id);
          await storage.updateUserPremiumStatus(subscription.customer, false);
          console.log(`🗑️ Subscription deactivated for customer ${subscription.customer}`);
          break;
          
        case 'charge.refunded':
          // Handle refunds
          const refundedCharge = event.data.object;
          console.log('💸 Charge refunded:', refundedCharge.id);
          console.log('💸 Refunded amount:', refundedCharge.amount_refunded, 'of', refundedCharge.amount);
          
          if (refundedCharge.customer) {
            console.log(`🔄 Revoking premium access for customer ${refundedCharge.customer} due to refund`);
            await storage.updateUserPremiumStatus(refundedCharge.customer, false);
            console.log(`💸 Premium access revoked for customer ${refundedCharge.customer} after refund`);
          }
          break;
          
        case 'charge.dispute.created':
          // Handle disputed charges (chargebacks)
          const disputedCharge = event.data.object;
          console.log('⚖️ Charge disputed:', disputedCharge.charge);
          
          // Get the charge details to find the customer
          const charge = await stripe.charges.retrieve(disputedCharge.charge);
          if (charge.customer) {
            console.log(`🔄 Revoking premium access for customer ${charge.customer} due to dispute`);
            await storage.updateUserPremiumStatus(charge.customer, false);
            console.log(`⚖️ Premium access revoked for customer ${charge.customer} after dispute`);
          }
          break;
          
        default:
          console.log('ℹ️ Unhandled webhook event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
