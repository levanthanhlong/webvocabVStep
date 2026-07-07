# VSTEP Vocab

Website học từ vựng cá nhân cho luyện thi VSTEP — nạp từ vựng theo từng lần, tra cứu phiên âm IPA tự động, học thuộc theo 5 chế độ (flashcard, trắc nghiệm, điền từ, bài test, ôn lại), tra từ điển, và ôn luyện 4 kỹ năng Reading/Listening/Writing/Speaking.

## Kiến trúc kỹ thuật

- **Backend:** Node.js + Express
- **Database:** MySQL (chạy local)
- **Frontend:** HTML/CSS/JS thuần, không dùng framework
- **Dev tooling:** nodemon (`npm run dev`) — tự restart khi sửa file backend (`server.js`, `config/`, `controllers/`, `routes/`, `services/`); file frontend trong `public/` áp dụng ngay không cần restart
- **Phát âm:** Web Speech API (`speechSynthesis`) — offline, không tốn phí
- **Phiên âm IPA + định nghĩa tiếng Anh:** tự động tra cứu qua [Free Dictionary API](https://dictionaryapi.dev/)
- **Nghĩa tiếng Việt (tab Từ điển):** tra cứu qua [MyMemory Translation API](https://mymemory.translated.net/) (miễn phí, không cần API key)

## Cài đặt

### 1. Yêu cầu

- Node.js >= 18
- MySQL đang chạy local

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Sao chép `.env.example` thành `.env` và điền thông tin kết nối MySQL:

```bash
cp .env.example .env
```

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=webvocab
PORT=3000
```

### 4. Tạo database

```bash
mysql -u root -p < db/schema.sql
```

Nếu đã cài từ trước (bảng `vocabulary` còn cột `status` cũ), chạy migration để chuyển sang theo dõi tiến độ theo từng chế độ học mà không mất dữ liệu:

```bash
mysql -u root -p < db/migrate_to_levels.sql
```

Nếu đã cài từ trước migration trên (còn nhóm theo `import_date` thay vì `import_batch`), chạy tiếp migration sau để chuyển sang nhóm theo từng lần nạp:

```bash
mysql -u root -p < db/migrate_to_batches.sql
```

Lệnh đầu tiên (`schema.sql`) tạo database `webvocab` và bảng `vocabulary` cho lần cài mới hoàn toàn.

### 5. Chạy server

```bash
npm start
```

Hoặc chạy chế độ dev bằng nodemon (tự restart khi sửa file backend):

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.

## Cấu trúc thư mục

```
webvocab/
├── server.js                    # Điểm khởi chạy Express
├── nodemon.json                 # Cấu hình theo dõi file cho `npm run dev`
├── config/db.js                 # Kết nối MySQL pool
├── db/
│   ├── schema.sql                # Schema database (cài mới hoàn toàn)
│   ├── migrate_to_levels.sql     # Migration: status -> flashcard/quiz/fill_done
│   └── migrate_to_batches.sql    # Migration: import_date -> import_batch
├── docs/                        # Nội dung tab "Kỹ năng" (bạn tự chỉnh sửa)
│   ├── reading.md
│   ├── listening.md
│   ├── writing.md
│   └── speaking.md
├── services/
│   ├── vocabParser.js           # Parse text nạp từ theo regex
│   └── dictionaryService.js     # Gọi Free Dictionary API (IPA + định nghĩa) + MyMemory (nghĩa tiếng Việt)
├── controllers/
│   ├── vocabController.js
│   ├── docsController.js        # Đọc file trong docs/
│   └── dictionaryController.js  # Tra từ điển (tab Từ điển)
├── routes/
│   ├── vocab.js
│   ├── docs.js
│   └── dictionary.js
└── public/                      # Frontend (vanilla JS)
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js                # Wrapper gọi API
        ├── speech.js             # Web Speech API
        ├── tabImport.js
        ├── tabList.js
        ├── tabStudy.js
        ├── tabByDate.js
        ├── tabSkill.js
        ├── tabDictionary.js
        └── main.js               # Điều hướng tab
```

## Định dạng nạp từ vựng

Dán nguyên khối text vào tab "Nạp từ vựng", mỗi dòng một từ theo định dạng:

```
N. word /phiên âm/ (loại từ): nghĩa -> ví dụ
```

Ví dụ:

```
1. abandon /ơ-ben-đần/ (v): từ bỏ -> He abandoned the project.
2. brief /brif/ (adj): ngắn gọn -> Please keep it brief.
```

Dòng sai định dạng sẽ bị bỏ qua và báo lỗi kèm số dòng, không chặn các dòng còn lại. Phiên âm IPA (`phonetic_ipa`) được tự động tra cứu qua Dictionary API; từ nào không tìm thấy sẽ để trống và có thể sửa tay ở tab "Danh sách từ vựng".

## 8 tab chính

| Tab | Chức năng |
|---|---|
| **Nạp từ vựng** | Dán text, parse, tự tra IPA, lưu DB — mỗi lần bấm "Nạp vào hệ thống" là 1 "lần nạp" (Lần 1, Lần 2, Lần 3...) riêng biệt |
| **Danh sách từ vựng** | Xem A-Z, tìm kiếm, phát âm, sửa IPA tay, đổi trạng thái |
| **Học thuộc theo lần nạp** | Chọn lần nạp, học theo lô 10 từ/lần với 5 chế độ: Flashcard / Trắc nghiệm / Điền từ vào câu / Bài test / Ôn lại — mỗi chế độ đều hiện kèm loại từ (n/v/adj...) |
| **Xem theo lần nạp** | Xem toàn bộ từ của 1 lần nạp cụ thể, không giới hạn. Có nút "Học lại từ đầu (lần này)" để reset tiến độ 3 chế độ về 0, "Xóa cả lần nạp này" nếu nạp nhầm, chọn nhiều từ (checkbox) để xóa hàng loạt, và xóa từng từ riêng lẻ (🗑) — có ở cả tab này lẫn "Danh sách từ vựng" |
| **Kỹ năng** | 4 tab con Reading / Listening / Writing / Speaking, hiển thị nội dung từ file tương ứng trong thư mục `docs/` (bạn tự chỉnh sửa nội dung, hiển thị dạng text thuần) |
| **Từ điển** | Tra 2 chiều Anh↔Việt, bất kỳ từ nào (không giới hạn trong DB của bạn), trả về **nhiều nghĩa** (tối đa 5) chứ không chỉ 1. Anh→Việt: IPA, các nghĩa tiếng Việt, định nghĩa tiếng Anh theo loại từ, ví dụ, từ đồng nghĩa. Việt→Anh: các bản dịch tiếng Anh, tự tra thêm định nghĩa/IPA cho bản dịch đầu tiên nếu khớp từ điển. Đổi chiều sẽ xóa input/kết quả cũ. Chỉ để tra cứu tham khảo, không lưu vào DB |
| **Dịch thuật** | Dịch cả đoạn văn bản (không chỉ 1 từ) 2 chiều Anh↔Việt, tối đa 500 ký tự/lần |

Chế độ học được lưu vào `localStorage` để giữ nguyên lựa chọn ở lần sau.

Nhóm theo **lần nạp** (`import_batch`) thay vì theo ngày, vì nạp nhiều lần trong cùng 1 ngày sẽ không bị dồn chung thành một danh sách quá dài — mỗi lần nạp là một số thứ tự tăng dần độc lập với ngày tháng.

Flashcard, Trắc nghiệm và Điền từ mỗi chế độ theo dõi tiến độ **độc lập** cho từng từ (3 cột `flashcard_done`/`quiz_done`/`fill_done`) — học xong ở 1 chế độ không làm các chế độ khác tự động hiện "đã thuộc". Trạng thái tổng (badge "Đã thuộc" ở tab Danh sách / Xem theo lần nạp) chỉ bật khi cả 3 chế độ đều xong.

**Ôn lại** không giới hạn theo lần nạp — random tối đa 10 từ bất kỳ trong toàn bộ DB đã đạt trạng thái "Đã thuộc", hiển thị dạng trắc nghiệm (mặc định). Chọn sai sẽ hiện popup báo học lại, đồng thời cả 3 cờ tiến độ của từ đó bị reset về 0, đưa từ quay lại vòng học bình thường của đúng lần nó được nạp.

**Bài test** kiểm tra **toàn bộ** từ vựng của lần nạp đang chọn (không lọc theo trạng thái Đã thuộc/Chưa thuộc như 3 chế độ kia). Mỗi câu ngẫu nhiên là dạng trắc nghiệm hoặc điền từ. Làm bài test **không** ảnh hưởng đến tiến độ `flashcard_done`/`quiz_done`/`fill_done` — chỉ tính điểm tạm trong phiên làm bài, nên có thể làm lại nhiều lần. Sau khi trả lời hết, hiện popup kết quả (số câu đúng/tổng, %) kèm nút "Làm lại" để xáo lại thứ tự và làm bài mới ngay.

## API Endpoints

```
POST   /api/vocab/import                       Parse text + tra IPA + lưu DB, trả về importBatch (số lần nạp)
GET    /api/vocab?search=...                    Danh sách A-Z + tìm kiếm
GET    /api/vocab/batches                       Danh sách lần nạp + ngày + tổng số từ mỗi lần
GET    /api/vocab/by-batch/:batch                Từ vựng của 1 lần nạp cụ thể
POST   /api/vocab/by-batch/:batch/reset          Reset flashcard_done/quiz_done/fill_done về 0 cho toàn bộ từ trong 1 lần nạp
GET    /api/vocab/study/batch?batch=&mode=       Lô 10 từ chưa xong ở đúng mode (flashcard/quiz/fill) trong 1 lần nạp + số còn lại
GET    /api/vocab/review/batch?count=           N từ ngẫu nhiên đã "Đã thuộc" trong toàn bộ DB để ôn lại
POST   /api/vocab/study/mark                    Body { id, mode, done } — mode: flashcard/quiz/fill/all
GET    /api/vocab/random?exclude_id=&count=&word_type=&is_phrase=   N từ ngẫu nhiên làm đáp án nhiễu (trắc nghiệm) — ưu tiên cùng word_type và cùng dạng cụm/từ đơn; không đủ thì lấy thêm từ bất kỳ
PUT    /api/vocab/:id                           Sửa tay phiên âm IPA hoặc thông tin từ
DELETE /api/vocab/:id                           Xóa 1 từ
POST   /api/vocab/bulk-delete                   Body { ids: [...] } — xóa nhiều từ cùng lúc
DELETE /api/vocab/by-batch/:batch                Xóa toàn bộ từ trong 1 lần nạp (dùng khi nạp nhầm)
GET    /api/docs/:skill                          Nội dung file docs/<skill>.md — skill: reading/listening/writing/speaking
GET    /api/dictionary/:word                     Tra 1 từ tiếng Anh — IPA, meanings_vi (mảng, tối đa 5 nghĩa), định nghĩa/ví dụ/đồng nghĩa tiếng Anh
GET    /api/dictionary/vi/:word                  Tra 1 từ tiếng Việt — translated_en (mảng, tối đa 5 bản dịch), định nghĩa tiếng Anh cho bản dịch đầu tiên
POST   /api/translate                            Body { text, from, to } — dịch đoạn văn bản (tối đa 500 ký tự)
```

## Bảng `vocabulary`

| Cột | Mô tả |
|---|---|
| `id` | Khóa chính, tự tăng |
| `word` | Từ tiếng Anh |
| `phonetic` | Phiên âm Việt hóa |
| `phonetic_ipa` | Phiên âm IPA, lấy tự động qua Dictionary API |
| `word_type` | Loại từ (n, v, adj...) |
| `meaning` | Nghĩa tiếng Việt |
| `example` | Câu ví dụ tiếng Anh |
| `import_date` | Ngày nạp (chỉ để hiển thị, không dùng để nhóm) |
| `import_batch` | Số thứ tự lần nạp (Lần 1, Lần 2...) — dùng để nhóm và học/xem theo lần |
| `flashcard_done` | Đã hoàn thành ở chế độ Flashcard (0/1) |
| `quiz_done` | Đã hoàn thành ở chế độ Trắc nghiệm (0/1) |
| `fill_done` | Đã hoàn thành ở chế độ Điền từ (0/1) |

Trạng thái tổng (`memorized`/`new` trả về từ API) được tính động: `memorized` chỉ khi cả 3 cột trên đều = 1.
