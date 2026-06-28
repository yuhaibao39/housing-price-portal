# Multi-Application Next.js Portal — Housing Price Prediction

一个统一的 Next.js 门户，托管两个独立的应用：**Property Value Estimator** 和 **Property Market Analysis**，集成同一个 LinearRegression 房价预测模型。

---

## 项目架构

```
horsing-price-portal-v1/
├── backend-python/              # App 1 Backend: Python FastAPI (port 8001)
│   ├── app/
│   │   ├── main.py              # FastAPI 入口 + CORS
│   │   ├── routes/
│   │   │   ├── health.py        # GET /health, GET /model-info
│   │   │   └── predict.py       # POST /predict, POST /predict/batch,
│   │   │                          GET /predict/history, POST /compare
│   │   ├── models/schemas.py    # Pydantic: HousingFeatures 等
│   │   └── services/
│   │       └── model_service.py # LinearRegression 模型加载/训练/预测
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend-java/                # App 2 Backend: Java Spring Boot (port 8080)
│   ├── pom.xml                  # Spring Boot 3.4.4, Java 21
│   ├── src/main/java/com/property/market/
│   │   ├── config/              # CacheConfig, WebConfig (CORS)
│   │   ├── controller/          # MarketController (REST API v2)
│   │   ├── dto/                 # PropertyFeatures, PredictionResult, 等
│   │   └── service/             # MlServiceClient → Task 1, MarketAnalysisService
│   └── Dockerfile
│
├── portal/                      # Next.js 16 门户 (App Router, port 3001)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # 根布局 (Geist 字体)
│   │   │   ├── page.tsx         # 首页 (双应用入口卡片 + 快速统计)
│   │   │   ├── loading.tsx      # 全局加载状态
│   │   │   ├── error.tsx        # 全局错误边界
│   │   │   ├── not-found.tsx    # 404 页面
│   │   │   ├── estimator/       # App 1: Property Value Estimator
│   │   │   │   ├── page.tsx     # 预测表单 + 结果图表 + 历史 + 对比
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   └── market-analysis/ # App 2: Property Market Analysis
│   │   │       ├── page.tsx     # 仪表板 + 趋势图 + What-If + 导出
│   │   │       ├── loading.tsx
│   │   │       └── error.tsx
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, AppLayout
│   │   │   └── ui/              # Button, Card, Input, Select, Badge,
│   │   │                          DataTable (搜索/排序/分页), Spinner
│   │   ├── hooks/               # usePrediction, useMarketData
│   │   └── lib/                 # types.ts, api.ts
│   ├── package.json
│   └── Dockerfile
│
├── ml-service/                  # ML 模型独立训练服务 (port 8002)
│   ├── model.py                 # RandomForest 训练 + 预测
│   ├── models/                  # 训练好的模型/缩放器/指标
│   └── Dockerfile
│
└── README.md
```

---

## 端口分配

| 服务 | 端口 | 来源 | 说明 |
|------|------|------|------|
| **Task 1 API** (ML 预测) | `8000` | Task 1 | 已部署运行，LinearRegression 模型，提供 `/predict`、`/predict/batch`、`/model-info` |
| **App 1 Backend** (Python) | `8001` | Task 2 | FastAPI，封装 Task 1 调用 + 历史记录 + 对比功能 |
| **App 2 Backend** (Java) | `8080` | Task 2 | Spring Boot，市场分析 + What-If + CSV/PDF 导出 |
| **Portal** (Next.js) | `3001` | Task 2 | 统一门户 UI，调用 Task 1 (8000) + App 1 Backend (8001) + App 2 Backend (8080) |
| **ML Service** (训练) | `8002` | 可选 | Flask，独立模型训练服务 (RandomForest) |

### 调用关系

```
Portal (3001)
  ├── 直接调用 Task 1 (8000)         → /predict, /predict/batch, /model-info
  ├── 调用 App 1 Backend (8001)      → /predict/history, /compare
  └── 调用 App 2 Backend (8080)      → /api/v2/statistics, /trends, /what-if, /export

App 1 Backend (8001)
  └── 内部调用 Task 1 (8000)          → 模型预测

App 2 Backend (8080)
  └── 内部调用 Task 1 (8000)          → 模型预测 + What-If 分析
```

---

## 环境要求

| 组件 | 版本要求 | 验证命令 |
|------|---------|---------|
| Node.js | >= 20 | `node --version` |
| npm | >= 10 | `npm --version` |
| Python | >= 3.12 | `python --version` |
| Java / JDK | >= 21 | `java --version` |
| Maven | >= 3.9 | `mvn --version` |

---

## 快速开始

> **前提：** Task 1 已部署运行在 `http://localhost:8000`。

### Step 1: 启动 App 1 Backend — Python FastAPI（端口 8001）

```bash
cd backend-python
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

首次启动会自动训练 LinearRegression 模型并保存到 `app/ml_model/`。

**验证：** 打开 http://localhost:8001/docs 查看 Swagger 文档。

### Step 2: 启动 App 2 Backend — Java Spring Boot（端口 8080）

```bash
cd backend-java
mvn clean package -DskipTests
mvn spring-boot:run
```

### Step 3: 启动 Portal — Next.js（端口 3001）

```bash
cd portal
npm install
npm run dev
```

打开 http://localhost:3001 即可访问门户。

### 可选：ML 模型独立训练服务（端口 8002）

> **注意：** `gunicorn` 仅支持 Linux/macOS。Windows 用户请在安装依赖后使用 `python model.py`（自动选择 waitress）。

```bash
cd ml-service
pip install -r requirements.txt

# Windows — 自动使用 waitress，端口 8002
python model.py

# Linux / Docker — gunicorn
# gunicorn --bind 0.0.0.0:8002 model:app
```

---

## 测试指南

### 1. Task 1 API 测试（端口 8000 — 已部署运行）

Task 1 是已部署的 ML 预测服务，Task 2 通过它获取模型预测。

#### 健康检查

```bash
curl http://localhost:8000/health
```

**预期响应：**
```json
{"status":"healthy","model_loaded":true,"version":"1.0.0"}
```

#### 模型信息

```bash
curl http://localhost:8000/model-info
```

**预期响应：**
```json
{
  "model_type": "LinearRegression",
  "coefficients": [
    {"feature": "square_footage", "coefficient": -74386.9},
    {"feature": "bedrooms", "coefficient": -5764.35},
    {"feature": "bathrooms", "coefficient": 718.96},
    {"feature": "year_built", "coefficient": 22387.22},
    {"feature": "lot_size", "coefficient": 78564.09},
    {"feature": "distance_to_city_center", "coefficient": 37930.13},
    {"feature": "school_rating", "coefficient": 20169.27}
  ],
  "intercept": 270375.0,
  "metrics": [
    {"name": "r2_score", "value": 0.9811},
    {"name": "mean_absolute_error", "value": 7916.2},
    {"name": "root_mean_squared_error", "value": 10277.05}
  ],
  "training_samples": 40,
  "feature_names": [
    "square_footage", "bedrooms", "bathrooms",
    "year_built", "lot_size", "distance_to_city_center", "school_rating"
  ]
}
```

#### 单一预测

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "square_footage": 1850,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1998,
      "lot_size": 7500,
      "distance_to_city_center": 5.6,
      "school_rating": 8.2
    }
  }'
```

**预期响应：**
```json
{
  "predicted_price": 281761.16,
  "input_features": { "square_footage": 1850.0, "bedrooms": 3, "bathrooms": 2.0, "year_built": 1998, "lot_size": 7500.0, "distance_to_city_center": 5.6, "school_rating": 8.2 }
}
```

#### 批量预测

```bash
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      { "square_footage": 1850, "bedrooms": 3, "bathrooms": 2, "year_built": 1998, "lot_size": 7500, "distance_to_city_center": 5.6, "school_rating": 8.2 },
      { "square_footage": 3200, "bedrooms": 5, "bathrooms": 3.5, "year_built": 2015, "lot_size": 12000, "distance_to_city_center": 12.0, "school_rating": 9.1 }
    ]
  }'
```

**预期响应：**
```json
{"predictions": [281761.16, 406103.8], "count": 2}
```

---

### 2. App 1 Backend 测试（Python FastAPI — 端口 8001）

App 1 Backend 提供预测历史和多属性对比功能。

#### 健康检查

```bash
curl http://localhost:8001/health
```

#### 通过 App 1 Backend 代理预测

```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "square_footage": 2100, "bedrooms": 4, "bathrooms": 2.5,
      "year_built": 2005, "lot_size": 10000,
      "distance_to_city_center": 8.2, "school_rating": 9.0
    }
  }'
```

#### 预测历史

```bash
# 先做几次预测，然后查看历史
curl "http://localhost:8001/predict/history?limit=10"
```

**预期响应：**
```json
[
  {
    "id": "1751112345-0",
    "features": { "square_footage": 1850, "bedrooms": 3, ... },
    "predicted_price": 281761.16,
    "timestamp": "2026-06-28T12:00:00Z"
  }
]
```

#### 多属性对比

```bash
curl -X POST http://localhost:8001/compare \
  -H "Content-Type: application/json" \
  -d '[
    { "square_footage": 1850, "bedrooms": 3, "bathrooms": 2, "year_built": 1998, "lot_size": 7500, "distance_to_city_center": 5.6, "school_rating": 8.2 },
    { "square_footage": 3200, "bedrooms": 5, "bathrooms": 3.5, "year_built": 2015, "lot_size": 12000, "distance_to_city_center": 12.0, "school_rating": 9.1 }
  ]'
```

**预期响应：**
```json
[
  { "index": 0, "predicted_price": 281761.16, "features": {...} },
  { "index": 1, "predicted_price": 406103.80, "features": {...} }
]
```

#### Swagger 文档

打开 http://localhost:8001/docs 交互式测试所有端点。

---

### 3. App 2 Backend 测试（Java Spring Boot — 端口 8080）

#### 健康检查

```bash
curl http://localhost:8080/api/v2/health
```

**预期响应：**
```json
{"status":"UP","mlService":"healthy","timestamp":"2026-06-28T..."}
```

#### 市场统计

```bash
curl http://localhost:8080/api/v2/statistics
```

**预期响应：**
```json
{
  "totalProperties": 20000,
  "avgPrice": 398123.45,
  "medianPrice": 385000.0,
  "minPrice": 150000.0,
  "maxPrice": 798000.0,
  "stdDevPrice": 125000.0,
  "avgByFeature": { "square_footage": 1850.0, ... },
  "featureCorrelations": { "square_footage": 0.78, "lot_size": 0.52, ... }
}
```

#### 市场趋势

```bash
curl http://localhost:8080/api/v2/trends
```

返回三个维度：`priceByIncome`（按房屋面积）、`priceByAge`（按房龄）、`priceByRegion`（按区域）。

#### 通过 Java 后端调用 ML 预测

```bash
curl -X POST http://localhost:8080/api/v2/predict \
  -H "Content-Type: application/json" \
  -d '{
    "squareFootage": 2100.0,
    "bedrooms": 4,
    "bathrooms": 2.5,
    "yearBuilt": 2005,
    "lotSize": 10000.0,
    "distanceToCityCenter": 8.2,
    "schoolRating": 9.0
  }'
```

> **注意：** Java 后端使用 camelCase 字段名，会自动映射为 Task 1 的 snake_case 格式。

#### What-If 分析

```bash
curl -X POST http://localhost:8080/api/v2/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "baseFeatures": {
      "squareFootage": 1850.0, "bedrooms": 3, "bathrooms": 2.0,
      "yearBuilt": 1998, "lotSize": 7500.0,
      "distanceToCityCenter": 5.6, "schoolRating": 8.2
    },
    "whatIfChanges": { "squareFootage": 3000.0 }
  }'
```

**预期响应：**
```json
{
  "baseline": { "predictedPrice": 281761.16, ... },
  "modified": { "predictedPrice": 422162.65, ... },
  "changes": { "squareFootage": 3000.0 },
  "percentageChange": 49.83
}
```

#### 数据导出

```bash
# CSV 格式
curl -o market_report.csv "http://localhost:8080/api/v2/export?format=csv"

# PDF 格式
curl -o market_report.pdf "http://localhost:8080/api/v2/export?format=pdf"
```

#### 清除缓存

```bash
curl -X DELETE http://localhost:8080/api/v2/cache
```

---

### 4. Portal 浏览器验证

启动所有服务后，在浏览器中访问：

| URL | 功能 | 依赖服务 |
|-----|------|---------|
| http://localhost:3001 | 门户首页（双应用入口卡片） | 无 |
| http://localhost:3001/estimator | 房价预测 — 表单 → 估值 + 系数图表 | Task 1 (`8000`) |
| http://localhost:3001/market-analysis | 市场分析仪表板 — 图表 + What-If + 导出 | Java (`8080`) |
| http://localhost:8000/docs | Task 1 Swagger 文档 | — |
| http://localhost:8001/docs | App 1 Backend Swagger 文档 | — |
| http://localhost:8080/api/v2/health | App 2 Backend 健康检查 | — |

#### Portal 功能测试清单

**App 1: Property Value Estimator (`/estimator`)**
- [ ] 输入 7 个房屋特征，点击 **Predict Price**
- [ ] 验证结果区域显示预测价格（USD）+ 模型系数条形图
- [ ] 页面顶部显示模型元信息（LinearRegression、R²、训练样本数）
- [ ] 切换到 **History** 标签 → 查看历史预测记录（搜索/排序/分页）
- [ ] 切换到 **Comparison** 标签 → 点击 **Run Comparison** 对比 2 套房产
- [ ] 点击 **Reset** 按钮恢复默认值

**App 2: Property Market Analysis (`/market-analysis`)**
- [ ] 查看 Market Overview 统计卡片（总数/均价/中位数/标准差）
- [ ] 查看 Feature Correlations 条形图
- [ ] 查看 Trends 图表（面积 / 房龄 / 区域三个维度）
- [ ] What-If 面板：下拉选择一个特征 → 输入新值 → **Run Analysis**
- [ ] 验证结果显示基准价 / 修改后价格 / 变化百分比
- [ ] 点击 **Export CSV** / **Export PDF** 下载报告

**通用**
- [ ] 顶部 Navbar 在首页 / Estimator / Market Analysis 三个页面间切换
- [ ] 当前活跃页面高亮显示
- [ ] 404 页面：访问 http://localhost:3001/nonexistent
- [ ] 响应式布局：缩放浏览器窗口验证移动端适配

---

### 5. 端到端集成测试

全链路验证 — 从 Portal 发起请求，经过各后端，最终返回结果：

```bash
# 1. Portal 调 Task 1 做预测（与 /estimator 页面行为一致）
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"features":{"square_footage":2500,"bedrooms":4,"bathrooms":3,"year_built":2010,"lot_size":9000,"distance_to_city_center":7.0,"school_rating":8.5}}'

# 2. Portal 调 App 1 Backend 查历史
curl "http://localhost:8001/predict/history?limit=5"

# 3. Portal 调 App 2 Backend 做 What-If
curl -X POST http://localhost:8080/api/v2/what-if \
  -H "Content-Type: application/json" \
  -d '{"baseFeatures":{"squareFootage":1850.0,"bedrooms":3,"bathrooms":2.0,"yearBuilt":1998,"lotSize":7500.0,"distanceToCityCenter":5.6,"schoolRating":8.2},"whatIfChanges":{"schoolRating":10.0}}'

# 4. 验证 Java 后端健康 + Task 1 连通性
curl http://localhost:8080/api/v2/health
```

---

### 6. 代码质量 & 构建验证

#### Portal (Next.js)

```bash
cd portal
npm run lint        # ESLint 代码检查
npm run build       # TypeScript 类型检查 + 生产构建
```

输出应为：
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (6/6)
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /estimator
└ ○ /market-analysis
```

#### Python Backend

```bash
cd backend-python

# 验证代码可导入
python -c "
from app.main import app
from app.services.model_service import ModelService
svc = ModelService()
assert svc.is_loaded(), 'Model should be loaded'
info = svc.get_model_info()
print(f'✓ Model: {info[\"model_type\"]}')
print(f'✓ R²: {info[\"metrics\"][0][\"value\"]}')
print(f'✓ Features: {len(info[\"feature_names\"])}')
print(f'✓ Training samples: {info[\"training_samples\"]}')
"

# 验证所有端点（需要先启动服务：uvicorn app.main:app --port 8001 &）
# curl http://localhost:8001/health
# curl http://localhost:8001/model-info
```

#### Java Backend

```bash
cd backend-java
mvn compile         # 编译检查
mvn test            # 单元测试（如果已编写）
```

---

## 特征说明

模型使用的 7 个输入特征：

| 字段名 (Python/Task 1) | 字段名 (Java) | 类型 | 范围 | 说明 |
|------------------------|---------------|------|------|------|
| `square_footage` | `squareFootage` | float | >= 0 | 房屋总面积 (sq ft) |
| `bedrooms` | `bedrooms` | int | 0–10 | 卧室数量 |
| `bathrooms` | `bathrooms` | float | >= 1 | 浴室数量 |
| `year_built` | `yearBuilt` | int | 1900–2030 | 建造年份 |
| `lot_size` | `lotSize` | float | >= 0 | 地块面积 (sq ft) |
| `distance_to_city_center` | `distanceToCityCenter` | float | >= 0 | 到市中心距离 (miles) |
| `school_rating` | `schoolRating` | float | 0–10 | 附近学校评分 |

各层之间自动做 snake_case ↔ camelCase 映射。

---

## Docker 部署

### 使用 Docker Compose（推荐）

```bash
docker compose up --build    # 构建并启动所有服务
docker compose up -d         # 后台运行
docker compose logs -f        # 查看日志
docker compose down           # 停止
```

### 单独构建各镜像

```bash
# App 1 Backend (port 8001)
docker build -t backend-python ./backend-python
docker run -d -p 8001:8001 --name backend-python backend-python

# App 2 Backend (port 8080)
docker build -t backend-java ./backend-java
docker run -d -p 8080:8080 --name backend-java backend-java

# Portal (port 3001)
docker build -t portal ./portal
docker run -d -p 3001:3001 --name portal portal
```

---

## 技术栈

| 层 | 技术 | 版本 |
|------|------|------|
| 门户框架 | Next.js (App Router) | 16.2.9 |
| UI 框架 | React | 19.2.4 |
| 样式 | Tailwind CSS | v4 |
| 图表 | Recharts | 3.9 |
| 状态管理 | Zustand | 5.0 |
| Python API | FastAPI | 0.115 |
| ML 模型 (Task 1) | LinearRegression (scikit-learn) | 1.6.1 |
| ML 模型 (训练服务) | RandomForestRegressor (scikit-learn) | 1.6.1 |
| Java API | Spring Boot | 3.4.4 |
| Java 版本 | JDK | 21 |
| 缓存 (Java) | Caffeine | — |
| 导出 (Java) | OpenCSV / PDFBox | 5.9 / 3.0.3 |

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Portal 无法连接 Task 1 | Task 1 (8000) 未运行 | 确认 Task 1 在 http://localhost:8000 运行中 |
| Portal 无法连接 App 1 Backend | Python 后端 (8001) 未启动 | `uvicorn app.main:app --port 8001` |
| Portal 无法连接 Java API | Java (8080) 未启动 | `mvn spring-boot:run` |
| Python `/predict` 返回 500 | 模型未训练 | 首次启动会自动训练，等待 2-3 秒 |
| Java 编译失败 | Maven 依赖未下载 | `mvn dependency:resolve` |
| Portal build 报错 | TypeScript 类型不匹配 | `npm run lint` 检查 |
| `/compare` (8001) 报 422 | 请求体格式错误 | 直接传数组 `[{...}, {...}]`，不需 `{"features": ...}` 包装 |
| 端口冲突 | 8000/8001/8080/3001 已被占用 | 检查已运行进程 `lsof -i :端口号` |
