import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { Category } from '../../db/model/category.model.js';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockCategoryModel: any;

  beforeEach(async () => {
    mockCategoryModel = {
      insertOne: vi.fn(),
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories when available', async () => {
      const mockCategories = [{ _id: 'cat1', name: 'Electronics', slug: 'electronics' }];
      mockCategoryModel.find.mockResolvedValue(mockCategories);

      const result = await service.findAll();
      expect(result).toEqual(mockCategories);
      expect(mockCategoryModel.find).toHaveBeenCalled();
    });

    it('should return message when no categories exist', async () => {
      mockCategoryModel.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual({ message: 'no category found' });
    });
  });

  describe('findOne', () => {
    it('should return category when found', async () => {
      const mockCategory = { _id: 'cat1', name: 'Electronics' };
      mockCategoryModel.findById.mockResolvedValue(mockCategory);

      const result = await service.findOne('cat1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw BadRequestException when category is not found', async () => {
      mockCategoryModel.findById.mockResolvedValue(null);

      await expect(service.findOne('cat999')).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create category with file upload', async () => {
      const createDto = { name: 'Electronics' };
      const mockFile = { path: 'uploads/electronics.jpg' } as Express.Multer.File;
      const createdCategory = { _id: 'cat1', name: 'Electronics', image: expect.any(String) };
      mockCategoryModel.insertOne.mockResolvedValue(createdCategory);

      const result = await service.create(createDto, mockFile);
      expect(result).toEqual(createdCategory);
      expect(mockCategoryModel.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Electronics' }),
      );
    });

    it('should throw BadRequestException if file is missing', async () => {
      const createDto = { name: 'Electronics' };
      await expect(service.create(createDto, null as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name is missing', async () => {
      const mockFile = { path: 'uploads/electronics.jpg' } as Express.Multer.File;
      await expect(service.create({ name: '' }, mockFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update category when found', async () => {
      const updateDto = { name: 'Electronics Updated' };
      const mockFile = { path: 'uploads/updated.jpg' } as Express.Multer.File;
      const existingCategory = { _id: 'cat1', name: 'Electronics' };
      const updatedCategory = { _id: 'cat1', name: 'Electronics Updated' };

      mockCategoryModel.findById.mockResolvedValue(existingCategory);
      mockCategoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      const result = await service.update('cat1', updateDto, mockFile);
      expect(result).toEqual(updatedCategory);
    });

    it('should throw BadRequestException when category to update is not found', async () => {
      const updateDto = { name: 'Electronics Updated' };
      const mockFile = { path: 'uploads/updated.jpg' } as Express.Multer.File;
      mockCategoryModel.findById.mockResolvedValue(null);

      await expect(service.update('cat999', updateDto, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove category when found', async () => {
      const deletedCategory = { _id: 'cat1', name: 'Electronics' };
      mockCategoryModel.findByIdAndDelete.mockResolvedValue(deletedCategory);

      const result = await service.remove('cat1');
      expect(result).toEqual({ message: 'deleted successfuly', deletedCategory });
    });

    it('should throw BadRequestException if deletion fails', async () => {
      mockCategoryModel.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove('cat999')).rejects.toThrow(BadRequestException);
    });
  });
});
