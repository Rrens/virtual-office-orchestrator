import { UserService } from '../services/user';

class UserController {
  private userService = new UserService();

  public register = async (req: express.Request, res: express.Response) => {
    try {
      const user = await this.userService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  public login = async (req: express.Request, res: express.Response) => {
    try {
      const user = await this.userService.login(req.body);
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  };
}

export default UserController;