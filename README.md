# HFUT 信息门户爬虫

## 安装运行

推荐 node 20

```bash
git clone https://github.com/hfut-soft-ware/hfut-api.git
cd hfut-api
npm i pnpm -g
pnpm i
# 开发
pnpm run dev
# 运行
pnpm run start
```

## 使用

接口采用文件路由的方式，在`src/modules` 文件夹下的，每个文件是一个单独的路由，文件名采用 `_` 分割，例如：

`src/modules/eam_coursesList.ts`的路由为 `/eam/coursesList`
