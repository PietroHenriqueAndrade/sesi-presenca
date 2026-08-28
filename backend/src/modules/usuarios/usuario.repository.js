const prisma = require('../../database/client');

class UsuarioRepository {
  async create(data) {
    return await prisma.usuario.create({
      data,
      select: { id: true, nome: true, email: true, role: true, ativo: true } // Ignora a senha no retorno
    });
  }

  async findByEmail(email) {
    return await prisma.usuario.findUnique({ where: { email } });
  }

  async findById(id) {
    return await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, role: true, ativo: true }
    });
  }

  async countActiveAdmins() {
    return prisma.usuario.count({ where: { role: 'ADMIN', ativo: true } });
  }

  async findAll() {
    return await prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, email: true, role: true, ativo: true },
      orderBy: { nome: 'asc' }
    });
  }

  async update(id, data) {
    const dadosAtualizacao = { ...data };

    if (dadosAtualizacao.senha) {
      const bcrypt = require('bcryptjs');
      dadosAtualizacao.senha = await bcrypt.hash(dadosAtualizacao.senha, 10);
      dadosAtualizacao.tokenVersion = { increment: 1 };
    }

    return prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
      select: { id: true, nome: true, email: true, role: true, ativo: true }
    });
  }

  async delete(id) {
    // Soft delete padrão
    return await prisma.usuario.update({
      where: { id },
      data: { ativo: false },
      select: { id: true, nome: true, email: true, role: true, ativo: true }
    });
  }
}

module.exports = new UsuarioRepository();