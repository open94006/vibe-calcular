import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private jwtService: JwtService) {}

    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;

        // 檢查使用者是否已存在
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // 雜湊密碼
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        // 建立使用者
        const user = await this.usersService.create({
            email,
            passwordHash,
            name,
        });

        return {
            message: 'User registered successfully',
            userId: user._id,
        };
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.passwordHash) {
            const isMatch = await bcrypt.compare(pass, user.passwordHash);
            if (isMatch) {
                const { passwordHash, ...result } = user.toObject();
                return result;
            }
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user._id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            },
        };
    }

    // Google Auth 基礎架構：驗證或建立 Google 使用者
    async validateGoogleUser(googleProfile: any) {
        const { id, emails, displayName, photos } = googleProfile;
        const email = emails[0].value;

        let user = await this.usersService.findByGoogleId(id);

        if (!user) {
            // 嘗試透過 email 尋找並連結
            user = await this.usersService.findByEmail(email);
            if (user) {
                // 更新 googleId
                // 這邊簡化處理，實際開發可能需要更多驗證
                user.googleId = id;
                await user.save();
            } else {
                // 建立新使用者
                user = await this.usersService.create({
                    email,
                    name: displayName,
                    googleId: id,
                    avatar: photos[0]?.value,
                });
            }
        }

        return user;
    }
}
