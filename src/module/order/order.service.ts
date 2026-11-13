import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderAddress,
  OrderDocument,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../db/model/order.model.js';
import { Cart, CartDocument } from '../../db/model/cart.model.js';
import { Product, ProductDocument } from '../../db/model/product.model.js';
import { User, HUserDocument } from '../../db/model/user.model.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { paymentServivce } from '../../common/service/stripe/stripe.service.js';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly _orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly _cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly _productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly _userModel: Model<HUserDocument>,
    private readonly paymentService: paymentServivce,
  ) {}

  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${randomHex}`;
  }

  private async resolveAddress(userId: string, dto?: CreateOrderDto): Promise<OrderAddress> {
    if (dto?.shippingAddress) {
      const { street, city, state, postalCode, phone } = dto.shippingAddress;
      if (!street || !city || !state || !postalCode) {
        throw new BadRequestException('Complete shipping address (street, city, state, postalCode) is required');
      }
      return { street, city, state, postalCode, phone };
    }

    const user = await this._userModel.findById(userId).exec();
    if (user && user.address && user.address.length > 0) {
      const defaultAddr = user.address.find((a) => a.isDefault) || user.address[0];
      return {
        street: defaultAddr.street,
        city: defaultAddr.city,
        state: defaultAddr.state,
        postalCode: defaultAddr.postalCode,
        phone: user.phone || undefined,
      };
    }

    throw new BadRequestException(
      'Shipping address is required. Please provide a shippingAddress in request or save one in your profile.',
    );
  }

  private async prepareOrderData(userId: string, dto?: CreateOrderDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const cart = await this._cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cannot checkout: cart is empty');
    }

    const shippingAddress = await this.resolveAddress(userId, dto);

    const productIds = cart.items.map((i) => i.productId);
    const products = await this._productModel.find({ _id: { $in: productIds } }).exec();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of cart.items) {
      const prodIdStr = item.productId.toString();
      if (!productMap.has(prodIdStr)) {
        throw new NotFoundException(`Product ${prodIdStr} in cart no longer exists`);
      }
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString())!;

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        );
      }

      const itemPrice = product.price;
      const itemSubtotal = Math.round(itemPrice * item.quantity * 100) / 100;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const total = subtotal;

    const deductedItems: { productId: Types.ObjectId; quantity: number }[] = [];
    for (const item of cart.items) {
      const updateResult = await this._productModel.updateOne(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
      );

      if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
        for (const deducted of deductedItems) {
          await this._productModel.updateOne(
            { _id: deducted.productId },
            { $inc: { stock: deducted.quantity } },
          );
        }
        const product = productMap.get(item.productId.toString())!;
        throw new BadRequestException(
          `Stock conflict: Insufficient stock for product "${product.name}". Please review your cart.`,
        );
      }

      deductedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    return { cart, productMap, shippingAddress, orderItems, subtotal, total };
  }

  async createCashOrder(userId: string, dto: CreateOrderDto = {}) {
    const { cart, shippingAddress, orderItems, subtotal, total } =
      await this.prepareOrderData(userId, dto);

    const order = new this._orderModel({
      userId: new Types.ObjectId(userId),
      orderNumber: this.generateOrderNumber(),
      items: orderItems,
      shippingAddress,
      subtotal,
      total,
      paymentMethod: PaymentMethod.CashOnDelivery,
      paymentStatus: PaymentStatus.Pending,
      orderStatus: OrderStatus.Pending,
    });

    const savedOrder = await order.save();

    cart.items = [];
    await cart.save();

    return {
      message: 'Order created successfully with Cash on Delivery',
      order: savedOrder,
    };
  }

  async createStripeOrder(userId: string, dto: CreateOrderDto = {}) {
    const user = await this._userModel.findById(userId).exec();
    const { cart, productMap, shippingAddress, orderItems, subtotal, total } =
      await this.prepareOrderData(userId, dto);

    const order = new this._orderModel({
      userId: new Types.ObjectId(userId),
      orderNumber: this.generateOrderNumber(),
      items: orderItems,
      shippingAddress,
      subtotal,
      total,
      paymentMethod: PaymentMethod.Card,
      paymentStatus: PaymentStatus.Pending,
      orderStatus: OrderStatus.Pending,
    });

    const savedOrder = await order.save();

    const line_items: any[] = cart.items.map((item) => {
      const product = productMap.get(item.productId.toString())!;
      return {
        price_data: {
          currency: 'egp',
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await this.paymentService.createCheckoutSession({
      customer_email: user?.email || '',
      metadata: { orderId: savedOrder._id.toString() },
      discounts: [],
      line_items,
      success_url: dto.success_url || 'http://localhost:3000/order/success',
      cancel_url: dto.cancel_url || 'http://localhost:3000/order/cancel',
    });

    savedOrder.stripeSessionId = session.id;
    savedOrder.stripeUrl = session.url || undefined;
    await savedOrder.save();

    cart.items = [];
    await cart.save();

    return {
      message: 'Order created successfully with Stripe',
      order: savedOrder,
      url: session.url,
      sessionId: session.id,
    };
  }
}
