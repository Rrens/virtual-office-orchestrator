import express from 'express';
import userRoutes from './routes/user';

const app = express();
app.use(express.json());

// Define routes
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});