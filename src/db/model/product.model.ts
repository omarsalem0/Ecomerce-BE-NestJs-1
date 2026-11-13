import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Category } from "./category.model.js";
import { Brand } from "./brand.model.js";
import { generateSlug } from "../../common/utils/slug.js";

@Schema({ _id: false })
export class ProductImage {
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: false })
  publicId?: string;
}
export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Product {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  slug: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  description: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  stock: number;

  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Brand.name,
    required: true,
  })
  brandId: Types.ObjectId;

  @Prop({
    type: [ProductImageSchema],
    default: [],
  })
  images: ProductImage[];
}

export type ProductDocument = Product & Document;

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre("validate", function () {
  if (this.isModified("name") && this.name) {
    this.slug = generateSlug(this.name);
  }
});

ProductSchema.virtual('availableStock').get(function (this: Product) {
  return this.stock ?? 0;
});

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });

export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema },
]);
