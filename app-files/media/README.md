# 媒體庫目錄說明

此目錄用於存放媒體庫中顯示的圖片和影片檔案。

## 目錄結構

```
media/
├── images/         # 存放圖片檔案
│   ├── sample1.jpg
│   ├── sample2.jpg
│   └── video-poster.jpg  (影片封面圖)
└── videos/         # 存放影片檔案
    └── sample.mp4
```

## 使用方式

### 1. 新增圖片

將您的圖片檔案放入 `images/` 目錄，支援的格式：
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

### 2. 新增影片

將您的影片檔案放入 `videos/` 目錄，支援的格式：
- `.mp4`（推薦）
- `.webm`
- `.mov`

### 3. 更新配置

在 `app-files/data.js` 的 `mediaGallery.items` 陣列中新增媒體項目：

```javascript
{
  "type": "image",           // 'image' 或 'video'
  "src": "media/images/photo.jpg",
  "title": "照片標題",
  "description": "照片描述"   // 可選
}
```

影片範例：
```javascript
{
  "type": "video",
  "src": "media/videos/video.mp4",
  "title": "影片標題",
  "poster": "media/images/video-poster.jpg",  // 封面圖（可選）
  "description": "影片描述"
}
```

## 測試說明

目前配置中已經預設了 3 個範例媒體項目：
- `sample1.jpg` - 範例照片 1
- `sample2.jpg` - 範例照片 2
- `sample.mp4` - 範例影片

**請將您的實際圖片和影片檔案放入對應目錄，或修改 `data.js` 中的路徑以指向您的檔案。**

## 建議

- 圖片建議尺寸：1920x1080 或更高
- 影片建議格式：MP4 (H.264 編碼)
- 檔案命名使用英文和數字，避免使用中文或特殊字元
- 控制檔案大小以確保載入速度（圖片 < 2MB，影片 < 50MB）
