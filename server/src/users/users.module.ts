import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service.js';
import { User, UserSchema } from './user.schema.js';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    providers: [UsersService],
    exports: [UsersService], // 匯出以供 AuthModule 使用
})
export class UsersModule {}
