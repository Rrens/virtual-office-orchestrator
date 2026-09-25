import { UserRepository } from '../repositories/user';
import bcrypt from 'bcrypt';

class UserService {
  private userRepository = new UserRepository();

  public async register(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    return this.userRepository.create(userData);
  }

  public async login(userData: any) {
    const user = await this.userRepository.findByEmail(userData.email);
    if (!user || !(await bcrypt.compare(userData.password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return user;
  }
}

export default UserService;