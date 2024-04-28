import firebase_admin
from firebase_admin import storage
from datetime import timedelta

def upload_video_to_storage(video_path, destination_path):
    # Tạo tham chiếu tới Firebase Storage
    bucket = storage.bucket()

    # def progress_callback(progress):
    #     bytes_transferred = progress.bytes_transferred
    #     total_bytes = progress.total_bytes
    #     progress_percentage = (bytes_transferred / total_bytes) * 100
    #     print("Upload progress: {:.2f}%".format(progress_percentage))

    # Tải lên video từ đường dẫn cục bộ lên Firebase Storage
    blob = bucket.blob(destination_path)
    blob.upload_from_filename(video_path)

    # Lấy URL của video từ Firebase Storage
    url = blob.generate_signed_url(
        version='v4',
        expiration=timedelta(days=7),  # Thời gian URL hết hạn sau 7 ngày
        method='GET'
    )

    return url

# Sử dụng hàm upload_video_to_storage để tải lên video và lấy URL
# video_path = 'path/to/video.mp4'  # Đường dẫn tới video cần tải lên
# destination_path = 'videos/video.mp4'  # Đường dẫn đích trên Firebase Storage
# video_url = upload_video_to_storage(video_path, destination_path)

# print("Video URL:", video_url)