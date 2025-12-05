import dotenv from 'dotenv';
import app from './index';
import { getPool } from './db/config';

// Load environment variables
dotenv.config();

// Set port
const port = process.env.PORT || 5000;

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Test database connection
getPool()
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection failed: ", err));
