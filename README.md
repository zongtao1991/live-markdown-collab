# 实时协作 Markdown 编辑器 PRD

**技术栈:** Unknown

---


### 项目概述
多人实时协作的 Markdown 编辑器，支持文档版本历史、实时光标同步、评论系统。

### 技术栈
- **后端**: Node.js + Express + Socket.IO + SQLite
- **前端**: React + Vite + Monaco Editor + TailwindCSS
- **实时通信**: Socket.IO (WebSocket)
- **状态管理**: Zustand + localStorage persist

### 核心功能
1. 用户注册/登录（JWT）
2. 文档 CRUD（创建、列表、编辑、删除）
3. 实时协作编辑（多人同时编辑同一文档）
4. 实时光标位置同步（显示其他用户的光标）
5. 文档版本历史（每次保存创建快照）
6. 行内评论系统（选中文本添加评论，支持回复）
7. Markdown 实时预览（左编辑右预览）

### 目录结构

```
live-markdown-collab/
├── server/
│   ├── src/
│   │   ├── index.js                 # Express + Socket.IO 入口
│   │   ├── db/
│   │   │   ├── index.js             # SQLite 连接
│   │   │   └── schema.js            # 表结构
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT 验证
│   │   │   └── errorHandler.js     # 统一错误处理
│   │   ├── routes/
│   │   │   ├── auth.js              # 注册/登录
│   │   │   ├── documents.js         # 文档 CRUD
│   │   │   ├── versions.js          # 版本历史
│   │   │   └── comments.js          # 评论 CRUD
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── documentController.js
│   │   │   ├── versionController.js
│   │   │   └── commentController.js
│   │   └── socket/
│   │       ├── index.js             # Socket.IO 初始化
│   │       └── handlers.js          # Socket 事件处理
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.jsx                 # React 入口
│   │   ├── App.jsx                  # 路由配置
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DocumentsPage.jsx    # 文档列表
│   │   │   └── EditorPage.jsx       # 编辑器页面
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── MonacoEditor.jsx # Monaco 编辑器封装
│   │   │   │   ├── MarkdownPreview.jsx
│   │   │   │   └── CursorOverlay.jsx # 其他用户光标
│   │   │   ├── Comment/
│   │   │   │   ├── CommentThread.jsx
│   │   │   │   └── CommentForm.jsx
│   │   │   └── Version/
│   │   │       └── VersionHistory.jsx
│   │   ├── store/
│   │   │   └── appStore.js          # Zustand store
│   │   ├── hooks/
│   │   │   └── useSocket.js         # Socket.IO hook
│   │   ├── api/
│   │   │   └── client.js            # axios 封装
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

### 数据库表结构

### users
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- password_hash (TEXT)
- created_at (DATETIME)

### documents
- id (INTEGER PRIMARY KEY)
- title (TEXT)
- content (TEXT)
- owner_id (INTEGER FK → users.id)
- created_at (DATETIME)
- updated_at (DATETIME)

### versions
- id (INTEGER PRIMARY KEY)
- document_id (INTEGER FK → documents.id)
- content (TEXT)
- created_by (INTEGER FK → users.id)
- created_at (DATETIME)

### comments
- id (INTEGER PRIMARY KEY)
- document_id (INTEGER FK → documents.id)
- author_id (INTEGER FK → users.id)
- parent_id (INTEGER FK → comments.id, nullable)
- content (TEXT)
- start_line (INTEGER)
- end_line (INTEGER)
- created_at (DATETIME)

### Socket.IO 事件

### 客户端 → 服务端
- `join:document` - 加入文档房间
- `leave:document` - 离开文档房间
- `content:change` - 内容变更（增量）
- `cursor:move` - 光标移动
- `comment:add` - 添加评论
- `version:save` - 保存版本快照

### 服务端 → 客户端
- `joined:document` - 确认加入房间
- `left:document` - 确认离开房间
- `content:updated` - 内容已更新（广播给其他用户）
- `cursor:moved` - 其他用户光标移动
- `comment:added` - 新评论添加
- `version:saved` - 版本快照已保存
- `error` - 错误消息

### 关键实现细节

### 1. 实时编辑同步
- 使用 Monaco Editor 的 `onDidChangeModelContent` 监听内容变化
- 通过 Socket.IO 发送增量变更（delta）而非全量内容
- 服务端广播给房间内其他用户，**同时写入数据库 documents 表**

### 2. 光标同步
- 监听 Monaco Editor 的 `onDidChangeCursorPosition`
- 通过 Socket.IO 广播光标位置（行号、列号）
- 使用 Monaco 的 decorations API 渲染其他用户光标

### 3. 版本历史
- 用户手动点击"保存版本"按钮时触发
- 通过 Socket.IO 发送 `version:save` 事件
- 服务端在 versions 表插入快照，**必须写数据库**

### 4. 评论系统
- 用户选中文本后点击"添加评论"
- 记录选中文本的起始行号和结束行号
- 通过 Socket.IO 发送 `comment:add` 事件
- 服务端在 comments 表插入记录，**必须写数据库**

### 5. 状态管理
- Zustand store 管理：当前用户、当前文档、评论列表、在线用户列表
- 使用 Zustand persist 中间件持久化 token 和 user 到 localStorage
- **注意**：不要在 store 外部手动操作 localStorage

### 6. Socket.IO 连接管理
- useSocket hook 封装 Socket.IO 连接逻辑
- 依赖 token 变化时重新连接
- **注意**：依赖数组中不要包含 store action 引用

### 端口配置
- 后端：7891
- 前端开发服务器：5174

### 启动方式
```bash
# 后端
cd server && npm install && npm start

# 前端
cd client && npm install && npm run dev
```

