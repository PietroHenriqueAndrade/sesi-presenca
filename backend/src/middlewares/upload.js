const multer = require('multer');
const AppError = require('../utils/AppError');

// Mantemos o arquivo na memória (RAM) porque vamos repassar direto pro Python, 
// assim não gastamos o disco do servidor no Render.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const permitidas = ['image/jpeg', 'image/png', 'image/jpg'];
  if (permitidas.includes(file.mimetype)) {
    cb(null, true); // Aceita o arquivo
  } else {
    cb(new AppError('Formato inválido. Apenas imagens JPEG e PNG são permitidas.', 400), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por foto
});

module.exports = upload;