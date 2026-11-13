import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import fs from 'node:fs';
import { Product, ProductDocument, ProductImage } from '../../db/model/product.model.js';
import { Category } from '../../db/model/category.model.js';
import { Brand } from '../../db/model/brand.model.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import cloudinary from '../../common/service/cloudinary/cloud.service.js';
import { generateSlug } from '../../common/utils/slug.js';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly _productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private readonly _categoryModel: Model<Category>,
    @InjectModel(Brand.name) private readonly _brandModel: Model<Brand>,
  ) {}

  private async uploadFiles(files?: Express.Multer.File[]): Promise<ProductImage[]> {
    if (!files || files.length === 0) return [];
    const images: ProductImage[] = [];

    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce/products',
        });
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new BadRequestException('Image upload failed');
      }
    }
    return images;
  }

  async create(createProductDto: CreateProductDto, files?: Express.Multer.File[]) {
    if (!Types.ObjectId.isValid(createProductDto.categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }
    if (!Types.ObjectId.isValid(createProductDto.brandId)) {
      throw new BadRequestException('Invalid brand ID');
    }

    const category = await this._categoryModel.findById(createProductDto.categoryId);
    if (!category) throw new NotFoundException('Category not found');

    const brand = await this._brandModel.findById(createProductDto.brandId);
    if (!brand) throw new NotFoundException('Brand not found');

    const slug = createProductDto.slug || generateSlug(createProductDto.name);
    const existing = await this._productModel.findOne({
      $or: [{ slug }, { name: createProductDto.name }],
    });
    if (existing) {
      throw new ConflictException('Product already exists');
    }

    const uploadedImages = await this.uploadFiles(files);
    const providedImages = (createProductDto.images || []).map((img) =>
      typeof img === 'string' ? { url: img } : img,
    );

    const product = new this._productModel({
      ...createProductDto,
      slug,
      images: [...providedImages, ...uploadedImages],
    });

    return await product.save();
  }

  async findAll(query?: any) {
    const filter: any = {};

    if (query?.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query?.categoryId) {
      filter.categoryId = query.categoryId;
    }
    if (query?.brandId) {
      filter.brandId = query.brandId;
    }

    return await this._productModel
      .find(filter)
      .populate('categoryId')
      .populate('brandId');
  }

  async findOne(id: string) {
    let product: any;
    if (Types.ObjectId.isValid(id)) {
      product = await this._productModel
        .findById(id)
        .populate('categoryId')
        .populate('brandId');
    } else {
      product = await this._productModel
        .findOne({ slug: id })
        .populate('categoryId')
        .populate('brandId');
    }

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, files?: Express.Multer.File[]) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this._productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.categoryId) {
      const category = await this._categoryModel.findById(updateProductDto.categoryId);
      if (!category) throw new NotFoundException('Category not found');
    }

    if (updateProductDto.brandId) {
      const brand = await this._brandModel.findById(updateProductDto.brandId);
      if (!brand) throw new NotFoundException('Brand not found');
    }

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const slug = updateProductDto.slug || generateSlug(updateProductDto.name);
      product.name = updateProductDto.name;
      product.slug = slug;
    }

    if (files && files.length > 0) {
      const newImages = await this.uploadFiles(files);
      product.images = [...(product.images || []), ...newImages];
    }

    if (updateProductDto.description !== undefined) product.description = updateProductDto.description;
    if (updateProductDto.price !== undefined) product.price = updateProductDto.price;
    if (updateProductDto.stock !== undefined) product.stock = updateProductDto.stock;
    if (updateProductDto.categoryId) product.categoryId = new Types.ObjectId(updateProductDto.categoryId);
    if (updateProductDto.brandId) product.brandId = new Types.ObjectId(updateProductDto.brandId);

    return await product.save();
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const deleted = await this._productModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Product not found');
    }

    return { message: 'Product deleted successfully', deleted };
  }
}
