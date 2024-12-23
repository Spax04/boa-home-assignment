import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';


export const verifyAppProxySignature = (req: Request, res: Response, next: NextFunction): void => {
  try {

    const { signature, ...params } = req.query;
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!signature || !secret) {
      console.error('Missing signature or secret');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const message = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('');

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    if (hmac !== signature) {
      console.error('Invalid HMAC signature');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    next();
  } catch (error) {
    console.error('HMAC verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const verifySessionToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!token || !secret) {
      console.error('Missing token or secret');
      res.status(401).json({ message: 'Unauthorized' });
      return 
    }

    const options: VerifyOptions = {
      clockTolerance: 5, 
    };

    const decoded = jwt.verify(token, secret, options) as JwtPayload;

    const customerIdMatch = decoded.sub?.match(/Customer\/(\d+)/);
    if (!customerIdMatch || !customerIdMatch[1]) {
      res.status(401).json({ message: 'Unauthorized' });
      return 
    }

    req.body.customer_id = customerIdMatch[1].toString();
    req.body.shop = decoded.dest;
 
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Session token expired:', error);
      res.status(401).json({ message: 'Session token expired' });
    } else if (error instanceof jwt.NotBeforeError) {
      console.error('Session token not active:', error);
      res.status(401).json({ message: 'Session token not active yet' });
    } else {
      console.error('Invalid session token:', error);
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
};