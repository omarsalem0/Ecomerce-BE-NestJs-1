import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RedisService } from './common/service/redis/redis.service.js';
import { tokenModule } from './common/service/token/token.module.js';
import { AuthModule } from './module/auth/auth.module.js';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CategoryModule } from './module/category/category.module.js';

@Module({
   
  controllers: [AppController],
  providers: [AppService,RedisService],
  imports: [
    ConfigModule.forRoot({
      envFilePath:['.env.dev','.env.prod'],
      isGlobal:true
    }),
    MongooseModule.forRootAsync({
      inject:[ConfigService],

      useFactory:async (configService:ConfigService)=>({
        uri:configService.get<string>('DB_URL'),
        onConnectionCreate:(connection:Connection)=>{
          connection.on('connected',()=>console.log("data base is connected ")),
          connection.on("error",()=>console.log("error in connection dataBase"))
          return connection
        }

      })
    }),
    //   GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile:join(process.cwd(),'src/schema.gql'),
    //   graphiql:true
    // }),

    AuthModule,tokenModule,CategoryModule
  ],
  exports:[RedisService]
})
export class AppModule {}
