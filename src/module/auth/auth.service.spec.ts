import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { User } from '../../db/model/user.model.js';
import { RedisService } from '../../common/service/redis/redis.service.js';
import { TokenService } from '../../common/service/token/token.service.js';
import { genderEnum } from '../../common/enums/user.enums.js';

describe('AuthService - Phase 1 (Profile & Core Functions)', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockRedisService: any;
  let mockTokenService: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: vi.fn(),
      findById: vi.fn(),
      insertOne: vi.fn(),
    };

    mockRedisService = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    };

    mockTokenService = {
      generateToken: vi.fn(),
      decodeToken: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should successfully update profile fields and embedded addresses', async () => {
      const mockUser: any = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '01000000000',
        gender: genderEnum.Male,
        password: 'hashed-password-123',
        address: [],
        save: vi.fn().mockResolvedValue(true),
        toObject: function () {
          return {
            _id: this._id,
            firstName: this.firstName,
            lastName: this.lastName,
            phone: this.phone,
            gender: this.gender,
            password: this.password,
            address: this.address,
          };
        },
      };

      mockUserModel.findById.mockResolvedValue(mockUser);

      const updateData = {
        userName: 'Jane Smith',
        phone: '01099999999',
        gender: genderEnum.Female,
        addresses: [
          {
            street: '123 Main St',
            city: 'Cairo',
            state: 'Cairo',
            postalCode: '11511',
            isDefault: true,
          },
        ],
      };

      const result = await service.updateProfile('user123', updateData);

      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.phone).toBe('01099999999');
      expect(mockUser.gender).toBe(genderEnum.Female);
      expect(mockUser.address).toHaveLength(1);
      expect(mockUser.address[0].street).toBe('123 Main St');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.message).toBe('profile updated successfully');
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent_user', { phone: '01011111111' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if userId is missing', async () => {
      await expect(service.updateProfile('', { phone: '01011111111' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
