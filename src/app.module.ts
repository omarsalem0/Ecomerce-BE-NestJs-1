import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Connection } from 'mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RedisService } from './common/service/redis/redis.service.js';
import { tokenModule } from './common/service/token/token.module.js';
import { AuthModule } from './module/auth/auth.module.js';
import { CategoryModule } from './module/category/category.module.js';
import { ProductModule } from './module/product/product.module.js';
import { BrandModule } from './module/brand/brand.module.js';
import { CartModule } from './module/cart/cart.module.js';
import { OrderModule } from './module/order/order.module.js';

@Module({
  controllers: [AppController],
  providers: [AppService, RedisService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env.prod'],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL') || configService.get<string>('DATABASEURL'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('data base is connected '));
          connection.on('error', () => console.log('error in connection dataBase'));
          return connection;
        },
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/schema.gql',
      playground: true,
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
    }),
    AuthModule,
    tokenModule,
    CategoryModule,
    BrandModule,
    ProductModule,
    CartModule,
    OrderModule,
  ],
  exports: [RedisService],
})
export class AppModule {}
