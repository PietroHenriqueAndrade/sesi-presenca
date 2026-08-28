class FaceNaoReconhecidaException implements Exception {
  final String mensagem;

  const FaceNaoReconhecidaException([this.mensagem = 'Face nao reconhecida']);
}
