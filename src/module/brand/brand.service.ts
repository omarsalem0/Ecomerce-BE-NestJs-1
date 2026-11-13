import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand } from '../../db/model/brand.model.js';
import { Product, ProductDocument } from '../../db/model/product.model.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { generateSlug } from '../../common/utils/slug.js';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private readonly _brandModel: Model<Brand>,
    @InjectModel(Product.name) private readonly _productModel: Model<ProductDocument>,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    if (!createBrandDto.name) {
      throw new BadRequestException('Brand name is required');
    }
    const slug = createBrandDto.slug || generateSlug(createBrandDto.name);
    const existing = await this._brandModel.findOne({ $or: [{ slug }, { name: createBrandDto.name }] });
    if (existing) {
      throw new ConflictException('Brand with this name or slug already exists');
    }

    const brand = new this._brandModel({
      ...createBrandDto,
      slug,
    });
    return await brand.save();
  }

  async findAll() {
    const brands = await this._brandModel.find();
    if (brands.length === 0) {
      return { message: 'no brand found' };
    }
    return brands;
  }

  async findOne(id: string) {
    let brand: any;
    if (Types.ObjectId.isValid(id)) {
      brand = await this._brandModel.findById(id);
    } else {
      brand = await this._brandModel.findOne({ slug: id });
    }
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID format');
    }
    const brand = await this._brandModel.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const slug = updateBrandDto.slug || generateSlug(updateBrandDto.name);
      const conflict = await this._brandModel.findOne({
        _id: { $ne: id },
        $or: [{ slug }, { name: updateBrandDto.name }],
      });
      if (conflict) {
        throw new ConflictException('Brand with this name or slug already exists');
      }
      brand.name = updateBrandDto.name;
      brand.slug = slug;
    }

    if (updateBrandDto.logo !== undefined) {
      brand.logo = updateBrandDto.logo;
    }

    return await brand.save();
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID format');
    }

    const productsCount = await this._productModel.countDocuments({
      brandId: new Types.ObjectId(id),
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete brand: ${productsCount} product(s) still reference it`,
      );
    }

    const deletedBrand = await this._brandModel.findByIdAndDelete(id);
    if (!deletedBrand) {
      throw new NotFoundException('Brand not found');
    }
    return { message: 'Brand deleted successfully', deletedBrand };
  }
}
