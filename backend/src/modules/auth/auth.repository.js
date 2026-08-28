const prisma = require('../../database/client');

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.usuario.findUnique({ where: { email } });
  }

  async findUserById(id) {
    return prisma.usuario.findUnique({ where: { id } });
  }

  async findById(id) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }
}

module.exports = new AuthRepository();
