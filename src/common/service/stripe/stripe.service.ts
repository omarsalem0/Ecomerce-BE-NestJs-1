import { ConfigService } from '@nestjs/config';
import { Injectable } from "@nestjs/common";
import Stripe from 'stripe'

@Injectable()
export class paymentServivce {
    private stripe:Stripe
    constructor(private readonly configService:ConfigService) {
        this.stripe=new Stripe(this.configService.get<string>("STRIPE_KEY")as string)
        
    }
     async createCheckoutSession({
    customer_email,
    metadata,
    discounts,
    line_items,
    success_url,
    cancel_url,
  }: {
    customer_email: string;
    metadata: Stripe.MetadataParam;
    discounts: Stripe.Checkout.SessionCreateParams.Discount[];
    line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
    success_url: string;
    cancel_url: string;
  }): Promise<Stripe.Checkout.Session> {
    return await this.stripe.checkout.sessions.create({
      customer_email,
      metadata,
      discounts,
      line_items,
      success_url: success_url || 'http://localhost:3000/successUrl',
      cancel_url: cancel_url || 'http://localhost:3000/cancelUrl',
      allowed_payment_method_types: ['card'],
      mode: "payment",
    });
  }
}