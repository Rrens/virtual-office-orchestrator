import redis from 'redis';
import { promisify } from 'util';

const client = redis.createClient();
client.on('error', (err) => console.error(err));

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

class UserCache {
  public async getUser(email: string): Promise<any> {
    const cachedUser = await getAsync(`user:${email}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
    return null;
  }

  public async setUser(email: string, user: any) {
    await setAsync(`user:${email}`, JSON.stringify(user), 'EX', 3600); // Cache for 1 hour
  }
}

export default UserCache;