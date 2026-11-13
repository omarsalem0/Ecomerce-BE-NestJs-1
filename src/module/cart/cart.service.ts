import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../../db/model/cart.model.js';
import { Product, ProductDocument } from '../../db/model/product.model.js';
import { AddToCartInput } from './graphql/dto/add-to-cart.input.js';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly _cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly _productModel: Model<ProductDocument>,
  ) {}

  private async enrichCart(cart: CartDocument | null, userId: string) {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        id: cart?._id?.toString() || undefined,
        _id: cart?._id?.toString() || undefined,
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await this._productModel.find({ _id: { $in: productIds } }).exec();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const enrichedItems = [];
    let totalPrice = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      const prodIdStr = item.productId.toString();
      const product = productMap.get(prodIdStr);

      if (product) {
        const price = product.price || 0;
        const subtotal = Math.round(item.quantity * price * 100) / 100;
        totalPrice += subtotal;
        totalItems += item.quantity;

        const imageUrls = (product.images || []).map((img: any) =>
          typeof img === 'string' ? img : img.url,
        );

        enrichedItems.push({
          productId: prodIdStr,
          name: product.name,
          slug: product.slug,
          price,
          quantity: item.quantity,
          subtotal,
          availableStock: product.stock,
          inStock: product.stock >= item.quantity,
          images: imageUrls,
        });
      }
    }

    totalPrice = Math.round(totalPrice * 100) / 100;

    return {
      id: cart._id.toString(),
      _id: cart._id.toString(),
      userId,
      items: enrichedItems,
      totalPrice,
      totalItems,
      updatedAt: (cart as any).updatedAt,
    };
  }

  async getCart(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const cart = await this._cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    return this.enrichCart(cart, userId);
  }

  async addToCart(userId: string, input: AddToCartInput | { productId: string; quantity?: number }) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const { productId } = input;
    const quantity = input.quantity ?? 1;

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be an integer greater than or equal to 1');
    }

    const product = await this._productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock <= 0) {
      throw new BadRequestException('Product is out of stock');
    }

    let cart = await this._cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      cart = new this._cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
      });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingIndex > -1) {
      const combinedQuantity = cart.items[existingIndex].quantity + quantity;
      if (combinedQuantity > product.stock) {
        throw new BadRequestException(
          `Cannot add quantity ${quantity}. Total in cart (${combinedQuantity}) would exceed available stock (${product.stock})`,
        );
      }
      cart.items[existingIndex].quantity = combinedQuantity;
    } else {
      if (quantity > product.stock) {
        throw new BadRequestException(
          `Requested quantity (${quantity}) exceeds available stock (${product.stock})`,
        );
      }
      cart.items.push({
        productId: new Types.ObjectId(productId),
        quantity,
      });
    }

    await cart.save();
    return this.enrichCart(cart, userId);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be an integer greater than or equal to 1');
    }

    const product = await this._productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException(
        `Requested quantity (${quantity}) exceeds available stock (${product.stock})`,
      );
    }

    const cart = await this._cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (itemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return this.enrichCart(cart, userId);
  }

  async removeItem(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const cart = await this._cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Product not found in cart');
    }

    await cart.save();
    return this.enrichCart(cart, userId);
  }

  async clearCart(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const cart = await this._cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return {
      id: cart?._id?.toString() || undefined,
      _id: cart?._id?.toString() || undefined,
      userId,
      items: [],
      totalPrice: 0,
      totalItems: 0,
      message: 'Cart cleared successfully',
      cart: {
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      },
    };
  }
}
