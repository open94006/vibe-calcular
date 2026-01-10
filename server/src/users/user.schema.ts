import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ type: String, required: true, unique: true, index: true })
    email!: string;
  
    @Prop({ type: String })
    passwordHash?: string;
  
    @Prop({ type: String, required: true })
    name!: string;
  
    @Prop({ type: String })
    googleId?: string;
  
    @Prop({ type: String })
    avatar?: string;
  
    @Prop({ type: String, default: 'user' })
    role!: string;
  }

export const UserSchema = SchemaFactory.createForClass(User);
