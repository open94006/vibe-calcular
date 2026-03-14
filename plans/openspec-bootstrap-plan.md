# OpenSpec Bootstrap Plan

## 套件安裝

在專案根目錄執行：

```bash
npm install -D @fission-ai/openspec@latest
```

安裝後可於 `package.json` 看到 `devDependencies` 新增 `@fission-ai/openspec`。

## 初始目錄結構

```text
openspec/
├─ README.md
├─ specs/
│  └─ 000-initial-spec.md
└─ templates/
   └─ spec-template.md
```

## 建議操作流程

1. 從 `openspec/templates/spec-template.md` 複製到 `openspec/specs/`。
2. 以遞增編號命名，例如 `001-weather-api.md`。
3. 補齊背景、目標、需求與驗收條件。
4. 在 PR/Issue 附上 spec 檔案路徑，便於審查。

## 驗收檢查

- `package.json` 已含 `@fission-ai/openspec`。
- `openspec/` 目錄結構完整。
- 可依模板快速新增下一份 spec。
