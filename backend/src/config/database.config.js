// O Prisma faz a maior parte do trabalho com o arquivo .env automaticamente,
// mas deixamos este arquivo para centralizar configurações extras de banco.
module.exports = {
  url: process.env.DATABASE_URL,
  // Se futuramente você precisar configurar um Pool de conexões (limite de acessos simultâneos ao banco),
  // ou logs específicos do banco de dados, essas regras viverão aqui.
  connectionLimit: 10,
  timeout: 5000
};