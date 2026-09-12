'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { errorResponse } = require('../utils/response');

/**
 * @middleware upload
 * @description Configuration Multer pour l'upload de fichiers
 */

// Créer les dossiers d'upload si nécessaire
const ensureUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/avatars',
    './uploads/logos',
    './uploads/qrcodes',
    './uploads/files',
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// Configuration du storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './uploads/files';

    if (file.fieldname === 'avatar') {
      uploadPath = './uploads/avatars';
    } else if (file.fieldname === 'logo') {
      uploadPath = './uploads/logos';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const docTypes = /pdf/;
  const videoTypes = /mp4|mov|avi|mkv/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (imageTypes.test(ext) || imageTypes.test(mime)) {
    return cb(null, true);
  }
  if (docTypes.test(ext) || docTypes.test(mime)) {
    return cb(null, true);
  }
  if (videoTypes.test(ext) || videoTypes.test(mime)) {
    return cb(null, true);
  }

  cb(new Error('Type de fichier non supporté. Formats acceptés : images, PDF, vidéos.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB par défaut
  },
});

// Middleware de gestion des erreurs Multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Fichier trop volumineux. Taille maximale : 5MB', 400);
    }
    return errorResponse(res, `Erreur d'upload: ${err.message}`, 400);
  }
  if (err) {
    return errorResponse(res, err.message, 400);
  }
  next();
};

module.exports = {
  upload,
  handleUploadError,
};
