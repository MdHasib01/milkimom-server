import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
  getPublicTheme,
  getPublicContent,
  getAdminThemes,
  getAdminContent,
  updateAdminTheme,
  updateAdminContent,
  resetAdminTheme,
  resetAdminContent,
  createAdminTheme,
  uploadImageAsset,
} from '../controllers/customizationController.js';
import { requireAdmin } from '../middleware/auth.js';

// Configure Multer storage to automatically save image files into server/uploads/:productSlug/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const slug = (req.params.slug || 'milkimom').toLowerCase().trim();
    const uploadDir = path.join(process.cwd(), 'uploads', slug);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '') || 'image';
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = allowedTypes.test(file.mimetype);
    if (extMatch && mimeMatch) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed!'));
    }
  },
});

const router = Router();

// Public routes (no admin auth required)
router.get('/public', getPublicTheme);
router.get('/public/:slug', getPublicTheme);
router.get('/content/public', getPublicContent);
router.get('/content/public/:slug', getPublicContent);

// Protected Admin routes
router.get('/admin', requireAdmin, getAdminThemes);
router.post('/admin', requireAdmin, createAdminTheme);
router.put('/admin/:slug', requireAdmin, updateAdminTheme);
router.post('/admin/:slug/reset', requireAdmin, resetAdminTheme);

// Section Content Admin routes
router.get('/content/admin/:slug?', requireAdmin, getAdminContent);
router.put('/content/admin/:slug', requireAdmin, updateAdminContent);
router.post('/content/admin/:slug/reset', requireAdmin, resetAdminContent);

// Asset Image Upload Admin route
router.post('/upload/:slug', requireAdmin, upload.single('image'), uploadImageAsset);

export default router;
