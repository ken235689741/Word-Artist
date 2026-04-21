# Word Artist MVP

最小可執行前端骨架，提供：
- 上傳參考圖片
- 指定字幅 × 行數（含字元比例自動適配）
- 風格切換（寫實 / 馬賽克 / 線稿）
- 依風格自動字元集（可關閉改用自訂字元）
- 裁切控制（四邊內縮：左/右/上/下，預設皆 0）
- 社群模板預覽切換（Threads / Facebook / Instagram）
- 複製文字與下載 TXT
- 匯出帶社群版型的 PNG

## 本機啟動

```bash
npm run start
```

然後開啟：
- <http://localhost:4173>

## 測試

```bash
npm test
```

## 同步到 GitHub

1. 設定遠端（第一次）
```bash
git remote add origin <你的 GitHub repo url>
```

2. 推送目前分支
```bash
git push -u origin $(git branch --show-current)
```

3. 在 GitHub 開 PR（或用 CLI）
```bash
gh pr create --fill
```
