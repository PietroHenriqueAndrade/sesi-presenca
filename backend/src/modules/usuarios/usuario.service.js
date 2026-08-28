const usuarioRepository = require('./usuario.repository');
const auditService = require('../auditoria/audit.service');
const AppError = require('../../utils/AppError');
const bcrypt = require('bcryptjs');

class UsuarioService {
  async criarUsuario(data, usuarioLogadoId) {
    // 1. Checa se o e-mail já está em uso
    const emailExiste = await usuarioRepository.findByEmail(data.email);
    if (emailExiste) {
      throw new AppError('Este e-mail já está cadastrado no sistema.', 400);
    }

    // 2. Criptografa a senha antes de salvar no banco
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(data.senha, salt);

    // 3. Salva no banco
    const novoUsuario = await usuarioRepository.create({
      ...data,
      senha: senhaHash
    });

    // 4. Grava no AuditLog (Com await para garantir a gravação)
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'CREATE',
      entidade: 'Usuario',
      entidadeId: novoUsuario.id,
      dadosNovos: novoUsuario
    });

    return novoUsuario;
  }

  async listarUsuarios() {
    return await usuarioRepository.findAll();
  }

  async buscarUsuarioPorId(id) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) throw new AppError('Usuário não encontrado.', 404);
    return usuario;
  }

  async atualizarUsuario(id, data, usuarioLogadoId) {
    // 👇 Removi os requires duplicados que estavam aqui dentro consumindo memória à toa!

    // 1. Garante que o usuário que queremos editar existe
    const usuarioAntigo = await usuarioRepository.findById(id);
    if (!usuarioAntigo) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const removendoPrivilegioDoUltimoAdmin = usuarioAntigo.role === 'ADMIN' && usuarioAntigo.ativo &&
      ((data.role && data.role !== 'ADMIN') || data.ativo === false);
    if (removendoPrivilegioDoUltimoAdmin && await usuarioRepository.countActiveAdmins() <= 1) {
      throw new AppError('Não é possível remover ou desativar o último administrador ativo.', 409);
    }

    // 2. Se tentarem mudar o e-mail, verifica se já não tem outro igual
    if (data.email && data.email !== usuarioAntigo.email) {
      const emailEmUso = await usuarioRepository.findByEmail(data.email);
      if (emailEmUso) {
        throw new AppError('Este e-mail já está em uso por outro usuário.', 400);
      }
    }

    // 3. Atualiza no banco
    const usuarioAtualizado = await usuarioRepository.update(id, data);

    // 4. Registra na Auditoria (LGPD) - Quem demitiu/editou quem?
    // 👇 BUG MÉDIO CORRIGIDO: Trocamos "cargo" por "role", que é o campo real do banco!
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'UPDATE',
      entidade: 'Usuario',
      entidadeId: id,
      dadosAntigos: { nome: usuarioAntigo.nome, ativo: usuarioAntigo.ativo, role: usuarioAntigo.role },
      dadosNovos: { nome: usuarioAtualizado.nome, ativo: usuarioAtualizado.ativo, role: usuarioAtualizado.role }
    });

    return usuarioAtualizado;
  }

  async deletarUsuario(id, usuarioLogadoId) {
    const usuarioAntigo = await usuarioRepository.findById(id);
    if (!usuarioAntigo) {
      throw new AppError('Usuário não encontrado.', 404);
    }
    if (id === usuarioLogadoId) {
      throw new AppError('Você não pode desativar a própria conta por esta rota.', 409);
    }
    if (usuarioAntigo.role === 'ADMIN' && usuarioAntigo.ativo && await usuarioRepository.countActiveAdmins() <= 1) {
      throw new AppError('Não é possível desativar o último administrador ativo.', 409);
    }

    // Chama o método soft-delete que já existe no repository
    await usuarioRepository.delete(id);

    // Registra na Auditoria (LGPD) - Quem demitiu/excluiu quem?
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'DELETE',
      entidade: 'Usuario',
      entidadeId: id,
      dadosAntigos: { nome: usuarioAntigo.nome, ativo: usuarioAntigo.ativo, role: usuarioAntigo.role }
    });
  }

}

module.exports = new UsuarioService();