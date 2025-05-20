"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler")); // Import asyncHandler for consistency
const defaultStepsController_1 = require("../controllers/defaultStepsController");
const router = (0, express_1.Router)();
// Define default steps route
// GET /api/default-steps/:category
router.get('/:category', (0, express_async_handler_1.default)(defaultStepsController_1.getDefaultStepsHandler));
// PUT /api/default-steps/:category
router.put('/:category', (0, express_async_handler_1.default)(defaultStepsController_1.createOrUpdateDefaultStepsHandler));
exports.default = router;
