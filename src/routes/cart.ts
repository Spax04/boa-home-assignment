import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Session } from '@shopify/shopify-api';
import { verifyAppProxySignature, verifySessionToken } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const cartRouter = Router();

interface SaveCartRequest extends Request {
  body: {
    items: Array<{
      variantId: string;
      quantity: number;
    }>;
    shop: string;
    customer_id: string;
  };
}

cartRouter.post('/save-cart', verifySessionToken, async (req: SaveCartRequest, res: Response) => {
  try {
    const { items, shop, customer_id } = req.body;
    
    if (!customer_id || typeof customer_id !== 'string') {
      res.status(400).json({
        message: 'Customer ID is required'
      });
      return;
    }

    if (!Array.isArray(items)) {
      res.status(400).json({
        message: 'Items must be an array'
      });
      return;
    }

    const savedCart = await prisma.savedCart.upsert({
      where: { 
        customerId_shop: {
          customerId: customer_id,
          shop: shop
        }
      },
      update: {
        items: items,
        updatedAt: new Date()
      },
      create: {
        customerId: customer_id,
        shop: shop,
        items: items,
      }
    });

    res.json({
      success: true,
      message: `Saved ${items.length} items to cart`,
      cart: savedCart
    });

  } catch (error) {
    console.error('Save cart error:', error);
    res.status(500).json({
      message: 'Failed to save cart'
    });
  }
});


cartRouter.get('/import-cart',verifyAppProxySignature, async (req: Request, res: Response) => {
  try {
    const { logged_in_customer_id, shop } = req.query;

    if (!logged_in_customer_id || typeof logged_in_customer_id !== 'string') {
      res.status(400).json({
        message: 'Customer ID is required'
      });
      return;
    }

    const savedCart = await prisma.savedCart.findUnique({
      where: { 
        customerId_shop: {
          customerId: logged_in_customer_id,
          shop: shop?.toString() || ''
        }
      }
    });

    if (!savedCart) {
      res.status(404).json({
        message: 'No saved cart found'
      });
      return;
    }

    res.json({
      success: true,
      cart: savedCart
    });

  } catch (error) {
    console.error('Get saved cart error:', error);
    res.status(500).json({
      message: 'Failed to retrieve saved cart'
    });
  }
});

export default cartRouter;