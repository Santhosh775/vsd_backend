const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dynamic storage configuration
const createStorage = (folder, prefix) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = `uploads/${folder}/`;
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });
};

// File filters
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, JPEG, and WebP images are allowed'), false);
    }
};

const documentFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and DOC files are allowed'), false);
    }
};

// Upload configurations
const uploadCategory = multer({
    storage: createStorage('categories', 'category'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProduct = multer({
    storage: createStorage('products', 'product'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadUser = multer({
    storage: createStorage('users', 'user'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadDocument = multer({
    storage: createStorage('documents', 'doc'),
    fileFilter: documentFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadFarmer = multer({
    storage: createStorage('farmers', 'farmer'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadSupplier = multer({
    storage: createStorage('suppliers', 'supplier'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadThirdParty = multer({
    storage: createStorage('thirdpartys', 'thirdparty'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadVendor = multer({
    storage: createStorage('vendors', 'vendor'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});
const uploadDriver = multer({
    storage: createStorage('drivers', 'driver'),
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
    uploadCategory,
    uploadProduct,
    uploadUser,
    uploadDocument,
    uploadFarmer,
    uploadSupplier,
    uploadThirdParty,
    uploadVendor,
    uploadDriver
};