const winston = require('winston');
require('winston-daily-rotate-file');

// Filtro da LGPD: Esconde padrões de E-mail e CPF
const mascararDadosLGPD = winston.format((info) => {
  if (info.message && typeof info.message === 'string') {
    // Mascara E-mails (ex: neil@senai.br vira ***@***.***)
    info.message = info.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***'); 
    // Mascara CPFs (ex: 123.456.789-00 vira ***.***.***-**)
    info.message = info.message.replace(/\b\d{3}\.\d{3}\.\d{3}\-\d{2}\b/g, '***.***.***-**'); 
  }
  return info;
});

const transportArquivo = new winston.transports.DailyRotateFile({
  filename: 'logs/senai-api-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    mascararDadosLGPD(), // <--- A MÁSCARA ENTRA AQUI
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [
    transportArquivo,
    new winston.transports.Console()
  ]
});

module.exports = logger;