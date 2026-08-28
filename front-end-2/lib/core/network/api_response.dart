class ApiResponse<T> {
  final String status;
  final T? data;
  final String? message;

  const ApiResponse({required this.status, this.data, this.message});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json)? fromData,
  ) => ApiResponse<T>(
    status: json['status'] as String? ?? 'success',
    data: fromData == null ? json['data'] as T? : fromData(json['data']),
    message: json['message'] as String?,
  );
}
