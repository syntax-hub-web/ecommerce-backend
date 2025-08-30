import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  HttpCode,
  ForbiddenException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { promises as fs } from 'fs';
import { UserStatus } from 'src/libs/enums';
import { LoginDto } from './dto/LoginDto';
import { User } from 'src/users/entities/user.entity';
import { VerifyOTPDto } from './dto/VerifyOTPDto';
import { ResendOTPDto } from './dto/ResendOTPDto';
import { activeMessage, forgetPasswordMessage, otpHtml } from 'src/libs/mail';
import { ForgetPasswordDto } from './dto/ForgetPasswordDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { ApiConsumes } from '@nestjs/swagger';
import { ActiveAccountDto } from './dto/activeAccount-dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  async register(
    @Body() createAuthDto: CreateAuthDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {

    let user: User | null;

    if (createAuthDto.email) {
      user = await this.authService.findByEmail(createAuthDto.email);
    } else {
      user = await this.authService.findByPhone(createAuthDto.phone);
    }
    if (user) {
      if (file) {
        await fs.unlink(file.path);
      }
      throw new ConflictException('User already exists!');
    }

    const role = await this.authService.getRoleById(createAuthDto.role_id);

    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      throw new NotFoundException('SECRET_KEY not found');
    }

    if (role && role.name === 'seller') {
      if (!createAuthDto.brand_name) {
        throw new BadRequestException('Brand name is required for seller');
      }
    }

    try {
      const hashPassword = await this.authService.hashPassword(
        createAuthDto.password,
      );
      let avatar = null;

      if (file) {
        avatar = `/uploads/${file.filename}`;
      }

      const user = await this.authService.register({
        ...createAuthDto,
        password: hashPassword,
        avatar,
      });

      if (role && role.name === 'seller') {
        await this.authService.createSeller({
          user_id: user.id.toString(),
          brand_name: createAuthDto.brand_name,
          brand_description: createAuthDto.brand_description,
        });
      }

      const activeCode = await this.authService.generateToken(
        { email: user.email, lastLogin: null },
        SECRET_KEY,
        '15m',
      );

      await this.authService.addTokenToUser(user.email, activeCode);

      // const html = activeMessage(activeCode);

      // await this.authService.sendTestEmail({
      //   email: user.email,
      //   subject: 'Activate Your Account',
      //   text: 'Please use this code to activate your account',
      //   html,
      // });

      return {
        success: true,
        message:
          'Account created successfully. Please check your email to activate your account.',
        data: { activeCode },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Post('active-account')
  @HttpCode(200)
  async activeAccount(@Body() activeAccountDto: ActiveAccountDto) {
    const { token } = activeAccountDto;

    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SECRET_KEY) {
      throw new NotFoundException('SECRET_KEY not found');
    }
    const decoded = (await this.authService.verifyToken(token, SECRET_KEY)) as {
      email: string;
    };
    if (!decoded) {
      throw new BadRequestException('Invalid token');
    }

    const user = await this.authService.findByEmail(decoded.email);



    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User already active');
    }

    if (user.activeCode !== token) {
      throw new BadRequestException('Invalid token');
    }

    try {
      await this.authService.updateUserStatus(user.id.toString());
      return {
        success: true,
        message: 'Active account success . You Can login now.',
        data: null,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    const { email, phone, password } = loginDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null;

    if (email) {
      user = await this.authService.findByEmail(email);
    } else {
      user = await this.authService.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Please activate your account');
    }

    if (user.blockUntil && user.blockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.blockUntil.getTime() - new Date().getTime()) / 1000,
      );
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      throw new ForbiddenException(
        `Account is locked, please try again in ${minutes} minutes and ${seconds} seconds`,
      );
    }

    const isPasswordValid = await this.authService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.authService.handleFieldAttempt(user);
      throw new BadRequestException('Invalid Credentials!');
    } else {
      try {
        const { otp, expireOtp } = await this.authService.generateOtp();

        await this.authService.updateUserOtp(
          user.id.toString(),
          otp,
          expireOtp,
        );

        const html = otpHtml(otp);

        // await this.authService.sendTestEmail({
        //   email: user.email,
        //   subject: "OTP Code",
        //   text: "OTP Code",
        //   html: html,
        // })

        await this.authService.resetFailedAttempts(user);

        return {
          success: true,
          message: 'OTP send to your mail successfully',
          data: { otp },
        };
      } catch (error) {
        throw new InternalServerErrorException(
          error?.message || 'Internal server error',
        );
      }
    }
  }

  @Post('verify-otp')
  @HttpCode(200)
  async verifyOTP(@Body() verifyOTPDto: VerifyOTPDto) {
    const { otp, email, phone } = verifyOTPDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null;

    if (email) {
      user = await this.authService.findByEmail(email);
    } else {
      user = await this.authService.findByPhone(phone);
    }

    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SECRET_KEY) {
      throw new NotFoundException('SECRET_KEY not found');
    }

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP!');
    }

    if (user.otpExpire < new Date()) {
      throw new BadRequestException('OTP expired!, resend OTP');
    }

    try {
      await this.authService.updateUserOtp(user.id.toString(), null, null);

      user.lastLogin = new Date();

      await this.authService.updateUserLastLogin(user);

      const token = await this.authService.generateToken(
        { email: user.email, lastLogin: user.lastLogin.getTime() },
        SECRET_KEY,
        '3h',
      );
      return {
        success: true,
        message: 'OTP verified successfully',
        data: { token },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Post('resend-otp')
  @HttpCode(200)
  async resendOTP(@Body() resendOTPDto: ResendOTPDto) {
    const { email, phone } = resendOTPDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null;

    if (email) {
      user = await this.authService.findByEmail(email);
    } else {
      user = await this.authService.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Please activate your account');
    }

    try {
      let otp = user.otp;
      let expireOtp = user.otpExpire;

      if (!expireOtp || expireOtp < new Date()) {
        const generated = await this.authService.generateOtp();
        otp = generated.otp;
        expireOtp = generated.expireOtp;

        await this.authService.updateUserOtp(
          user.id.toString(),
          otp,
          expireOtp,
        );
      }

      const html = otpHtml(otp);

      // await this.authService.sendTestEmail({
      //   email: user.email,
      //   subject: "OTP Code",
      //   text: `Your OTP code is ${otp}`,
      //   html: html,
      // });

      return {
        success: true,
        message: 'OTP sent to your email successfully',
        data: { otp },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Post('resend-active-code')
  @HttpCode(200)
  async resendActiveCode(@Body() resendActiveCode: ResendOTPDto) {
    const { email, phone } = resendActiveCode;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null;
    if (email) {
      user = await this.authService.findByEmail(email);
    } else {
      user = await this.authService.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User already active');
    }

    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      throw new NotFoundException('SECRET_KEY not found');
    }

    if (!user.activeCode) {
      throw new BadRequestException('Active code not found');
    }

    let activeCode: string;

    try {
      await this.authService.verifyToken(user.activeCode, SECRET_KEY);
      activeCode = user.activeCode;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        activeCode = await this.authService.generateToken(
          { email: user.email, lastLogin: null },
          SECRET_KEY,
          '15m',
        );

        await this.authService.addTokenToUser(user.email, activeCode);
      } else {
        throw new BadRequestException('Invalid active code');
      }
    }

    const html = activeMessage(activeCode);

    // await this.authService.sendTestEmail({
    //   email: user.email,
    //   subject: "Activate Your Account",
    //   text: "Please use this code to activate your account",
    //   html,
    // });

    return {
      success: true,
      message: 'Activation code resent successfully',
      data: { activeCode },
    };
  }

  @Post('forget-password')
  @HttpCode(200)
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    const { email, phone } = forgetPasswordDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null;
    if (email) {
      user = await this.authService.findByEmail(email);
    } else {
      user = await this.authService.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Please activate your account');
    }

    try {
      const { otp, expireOtp } = await this.authService.generateOtp();

      await this.authService.updateUserOtp(user.id.toString(), otp, expireOtp);

      const html = forgetPasswordMessage(otp);

      // await this.authService.sendTestEmail({
      //   email: user.email,
      //   subject: 'Reset Your Password',
      //   text: `Use this OTP to reset your password: ${otp}`,
      //   html,
      // });

      return {
        success: true,
        message: 'OTP sent to your email successfully',
        data: { otp },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Post('check-otp-expire')
  @HttpCode(200)
  async checkOTPExpire(@Body() checkOTPExpireDto: VerifyOTPDto) {
    const { email, phone } = checkOTPExpireDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null = null;
    if (email) {
      user = await this.authService.findByEmail(email);
    } else if (phone) {
      user = await this.authService.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otp || !user.otpExpire) {
      throw new BadRequestException('No OTP found for this user');
    }

    if (new Date(user.otpExpire) < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    return {
      success: true,
      message: 'OTP is valid',
      data: null,
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { otp, email, phone, password } = resetPasswordDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let user: User | null = null;
    if (email) {
      user = await this.authService.findByEmail(email);
    } else if (phone) {
      user = await this.authService.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Please activate your account');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('OTP invalid');
    }

    if (new Date(user.otpExpire) < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const hashingPassword = await this.authService.hashPassword(password);

    try {
      await this.authService.updateUserOtp(user.id.toString(), null, null);

      await this.authService.updateUserPassword(
        user.id.toString(),
        hashingPassword,
      );

      return {
        status: true,
        message: 'Password reset successfully',
        data: null,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Get('current-user')
  @UseGuards(JwtAuthGuard)
  async currentUser(@CurrentUser() currentUser: User) {
    return {
      status: true,
      message: 'Current user returned successfully',
      data: { user: currentUser },
    };
  }

}