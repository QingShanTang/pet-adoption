# 宠物领养 App 设计文档

**日期：** 2026-03-05

## 概述

一个移动端优先的宠物领养 Web 应用，用户可以浏览待领养宠物、提交领养申请；管理员可以管理宠物信息并审核申请。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js (App Router) |
| 数据库 + 认证 + 存储 | Supabase |
| 部署 | Vercel |
| 样式 | Tailwind CSS |

## 架构

单仓库，Next.js 同时承载用户端和管理后台：

```
/pet-adoption
  /app
    /(user)              → 用户端路由（移动端响应式）
    /(admin)             → 管理后台路由（需管理员角色）
  /components
  /lib
    supabase.ts          → Supabase 客户端初始化
  /types
    index.ts             → 共享类型定义
```

本地开发：`npm run dev`
生产部署：Vercel

## 页面结构

### 用户端

| 路由 | 说明 |
|------|------|
| `/` | 宠物列表，卡片网格，支持搜索和筛选 |
| `/pets/[id]` | 宠物详情：照片、品种、年龄、性格描述 |
| `/adopt/[id]` | 领养申请表单（需登录） |
| `/login` | 登录 |
| `/register` | 注册 |
| `/my/applications` | 我的申请及状态 |

### 管理后台

| 路由 | 说明 |
|------|------|
| `/admin/pets` | 宠物管理（增删改查、上传图片） |
| `/admin/applications` | 审核领养申请（通过/拒绝） |

## 数据模型

```sql
-- 用户（由 Supabase Auth 管理，profiles 扩展表）
profiles (
  id          uuid references auth.users,
  name        text,
  phone       text,
  role        text default 'user'  -- 'user' | 'admin'
)

-- 宠物
pets (
  id          uuid primary key,
  name        text not null,
  species     text not null,        -- 猫、狗、其他
  breed       text,
  age         int,                  -- 月龄
  gender      text,                 -- 'male' | 'female'
  description text,
  status      text default 'available', -- 'available' | 'pending' | 'adopted'
  image_url   text,
  created_at  timestamptz default now()
)

-- 领养申请
applications (
  id          uuid primary key,
  user_id     uuid references profiles(id),
  pet_id      uuid references pets(id),
  status      text default 'pending', -- 'pending' | 'approved' | 'rejected'
  message     text,
  created_at  timestamptz default now()
)
```

## 核心功能流程

### 用户领养流程

1. 浏览首页宠物列表（可按品种、年龄、状态筛选）
2. 点击宠物卡片查看详情
3. 点击"申请领养"→ 未登录则跳转登录页
4. 填写申请说明并提交
5. 在"我的申请"查看状态更新

### 管理员流程

1. 以管理员账号登录
2. 进入 `/admin/pets` 添加/编辑宠物信息，上传照片
3. 进入 `/admin/applications` 查看待审核申请
4. 通过或拒绝申请（同时自动更新宠物状态）

## 访问控制

- Supabase Row Level Security (RLS) 保护数据访问
- 管理员路由通过 Next.js middleware 检查 `role === 'admin'`
- 领养申请接口需登录用户才能访问

## 搜索与筛选

首页支持以下筛选维度：
- 关键词搜索（宠物名称）
- 物种（猫/狗/其他）
- 性别
- 状态（仅展示 available）
