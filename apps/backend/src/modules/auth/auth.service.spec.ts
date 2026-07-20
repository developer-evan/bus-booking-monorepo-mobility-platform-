import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CompaniesService } from '../companies/companies.service';
import { UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      | 'create'
      | 'sanitizeUser'
      | 'findByInviteContact'
      | 'findByIdentifier'
      | 'resolveAvailableInviteContact'
      | 'completeStaffInviteActivation'
    >
  >;
  let companiesService: jest.Mocked<
    Pick<
      CompaniesService,
      | 'findPendingInviteByIdentifier'
      | 'verifyInviteOtp'
      | 'markInviteAccepted'
      | 'sendInviteOtp'
    >
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      sanitizeUser: jest.fn((user) => user),
      findByInviteContact: jest.fn(),
      findByIdentifier: jest.fn(),
      resolveAvailableInviteContact: jest.fn(),
      completeStaffInviteActivation: jest.fn(),
    };
    companiesService = {
      findPendingInviteByIdentifier: jest.fn(),
      verifyInviteOtp: jest.fn(),
      markInviteAccepted: jest.fn(),
      sendInviteOtp: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: CompaniesService, useValue: companiesService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('activateInvite creates a staff user after OTP verification', async () => {
    const companyId = new Types.ObjectId();
    const createdUser = {
      _id: new Types.ObjectId(),
      fullName: 'Jane Admin',
      email: 'jane@coastal.com',
      role: UserRole.ADMIN,
      company: companyId,
      toObject: () => ({}),
    };

    companiesService.findPendingInviteByIdentifier.mockResolvedValue({
      email: 'jane@coastal.com',
      role: UserRole.ADMIN,
      company: companyId,
    } as never);
    companiesService.verifyInviteOtp.mockResolvedValue(undefined);
    usersService.findByInviteContact.mockResolvedValue(null);
    usersService.findByIdentifier.mockResolvedValue(null);
    usersService.resolveAvailableInviteContact.mockResolvedValue({
      email: 'jane@coastal.com',
    });
    usersService.create.mockResolvedValue(createdUser as never);

    await service.activateInvite({
      identifier: 'jane@coastal.com',
      otp: '483921',
      fullName: 'Jane Admin',
      password: 'SecurePass123',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        company: companyId.toString(),
        role: UserRole.ADMIN,
        email: 'jane@coastal.com',
      }),
    );
    expect(companiesService.markInviteAccepted).toHaveBeenCalled();
  });

  it('activateInvite completes a previously stuck staff activation', async () => {
    const companyId = new Types.ObjectId();
    const existingUserId = new Types.ObjectId();
    const completedUser = {
      _id: existingUserId,
      fullName: 'Jane Admin',
      email: 'jane@coastal.com',
      role: UserRole.ADMIN,
      company: companyId,
      toObject: () => ({}),
    };

    companiesService.findPendingInviteByIdentifier.mockResolvedValue({
      email: 'jane@coastal.com',
      role: UserRole.ADMIN,
      company: companyId,
    } as never);
    companiesService.verifyInviteOtp.mockResolvedValue(undefined);
    usersService.findByInviteContact.mockResolvedValue({
      _id: existingUserId,
      role: UserRole.ADMIN,
      company: companyId,
    } as never);
    usersService.findByIdentifier.mockResolvedValue(null);
    usersService.resolveAvailableInviteContact.mockResolvedValue({
      email: 'jane@coastal.com',
    });
    usersService.completeStaffInviteActivation.mockResolvedValue(
      completedUser as never,
    );

    const response = await service.activateInvite({
      identifier: 'jane@coastal.com',
      otp: '483921',
      fullName: 'Jane Admin',
      password: 'SecurePass123',
    });

    expect(usersService.completeStaffInviteActivation).toHaveBeenCalledWith(
      existingUserId.toString(),
      expect.objectContaining({
        company: companyId.toString(),
        role: UserRole.ADMIN,
        email: 'jane@coastal.com',
      }),
    );
    expect(usersService.create).not.toHaveBeenCalled();
    expect(companiesService.markInviteAccepted).toHaveBeenCalled();
    expect(response.accessToken).toBe('token');
  });

  it('activateInvite skips phone when it belongs to another account', async () => {
    const companyId = new Types.ObjectId();

    companiesService.findPendingInviteByIdentifier.mockResolvedValue({
      email: 'jane@coastal.com',
      phone: '+254700000000',
      role: UserRole.ADMIN,
      company: companyId,
    } as never);
    companiesService.verifyInviteOtp.mockResolvedValue(undefined);
    usersService.findByInviteContact.mockResolvedValue(null);
    usersService.findByIdentifier.mockResolvedValue(null);
    usersService.resolveAvailableInviteContact.mockResolvedValue({
      email: 'jane@coastal.com',
    });
    usersService.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      role: UserRole.ADMIN,
      company: companyId,
      toObject: () => ({}),
    } as never);

    await service.activateInvite({
      identifier: 'jane@coastal.com',
      otp: '483921',
      fullName: 'Jane Admin',
      password: 'SecurePass123',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@coastal.com',
        phone: undefined,
      }),
    );
  });

  it('activateInvite rejects when contact belongs to a customer account', async () => {
    companiesService.findPendingInviteByIdentifier.mockResolvedValue({
      email: 'jane@coastal.com',
      role: UserRole.ADMIN,
      company: new Types.ObjectId(),
    } as never);
    companiesService.verifyInviteOtp.mockResolvedValue(undefined);
    usersService.findByInviteContact.mockResolvedValue({
      _id: new Types.ObjectId(),
      role: UserRole.CUSTOMER,
    } as never);
    usersService.findByIdentifier.mockResolvedValue(null);
    usersService.resolveAvailableInviteContact.mockResolvedValue({
      email: 'jane@coastal.com',
    });

    await expect(
      service.activateInvite({
        identifier: 'jane@coastal.com',
        otp: '483921',
        fullName: 'Jane Admin',
        password: 'SecurePass123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersService.completeStaffInviteActivation).not.toHaveBeenCalled();
    expect(companiesService.markInviteAccepted).not.toHaveBeenCalled();
  });
});
