import { PrismaClient } from '@prisma/client';

class UserRepository {
  private prisma = new PrismaClient();

  public async create(userData: any) {
    return this.prisma.user.create({ data: userData });
  }

  public async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

export default UserRepository;