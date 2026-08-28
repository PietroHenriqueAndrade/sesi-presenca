import 'dart:io';
import '../data/api/api_recognition_data_source.dart';
import '../models/aluno.dart';

class ReconhecimentoRepository {
  ReconhecimentoRepository({
    ApiRecognitionDataSource? recognitionDataSource,
  }) : _recognitionDataSource =
            recognitionDataSource ?? ApiRecognitionDataSource();

  final ApiRecognitionDataSource _recognitionDataSource;

  // 👇 O Repositório agora é direto e reto!
  Future<Aluno> reconhecerAluno(File foto) async {
    
    // 1. Chama a API (que bate no Python, que avisa o Node, que salva no Postgres)
    final aluno = await _recognitionDataSource.reconhecerAluno(foto);
    
    // 2. Acabou! Não enfileiramos mais offline. 
    // Se chegou até aqui sem dar erro, a presença já está oficializada no banco.
    return aluno;
  }
}