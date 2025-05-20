"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const cors_1 = __importDefault(require("cors"));
const ingredientRoutes_1 = __importDefault(require("./routes/ingredientRoutes")); // Import the ingredient router
const recipeRoutes_1 = __importDefault(require("./routes/recipeRoutes")); // Import the recipe router
const defaultStepsRoutes_1 = __importDefault(require("./routes/defaultStepsRoutes")); // Import the default steps router
const app = (0, express_1.default)();
// Use PORT from environment variables with a default fallback
const PORT = process.env.PORT || 3001;
// CORS Configuration
// const allowedOriginsDev = ['http://localhost:5173', 'http://localhost:3000']; // Add other dev origins if needed
// const corsOptions = {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//     if (process.env.NODE_ENV === 'production') {
//       const prodOrigin = process.env.CORS_ALLOWED_ORIGIN;
//       if (prodOrigin && origin === prodOrigin) {
//         callback(null, true);
//       } else if (!prodOrigin && !origin) {
//         // Allow requests with no origin (like mobile apps or curl requests) in production if CORS_ALLOWED_ORIGIN is not set
//         // For stricter control, you might want to disallow this or make it configurable.
//         callback(null, true);
//       }
//       else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     } else {
//       // Development: allow from defined list or if no origin (e.g. curl, Postman)
//       if (!origin || (origin && allowedOriginsDev.includes(origin))) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     }
//   },
//   credentials: true, // If you need to allow cookies or authorization headers
// };
// Apply middleware BEFORE defining routes
// app.use(cors(corsOptions)); // Enable CORS with dynamic options
app.use((0, cors_1.default)()); // Enable CORS with default settings
app.use(express_1.default.json()); // Parse JSON request bodies
// Basic health check route
// Basic health check route
app.get('/', (req, res) => {
    res.send('Server is running');
});
// Mount API routes
app.use('/api/ingredients', ingredientRoutes_1.default); // Mount ingredient routes
app.use('/api/recipes', recipeRoutes_1.default); // Mount recipe routes
app.use('/api/default-steps', defaultStepsRoutes_1.default); // Mount default steps routes
// Connect to Database and Start Server
const startServer = async () => {
    await (0, db_1.default)(); // Connect to DB first
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
};
startServer();
