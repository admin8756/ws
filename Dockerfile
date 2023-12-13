FROM --platform=linux/arm64/v8 node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制项目代码
COPY ./ .

# 安装 pnpm 包管理工具
RUN npm install -g pnpm

# 安装项目所需的依赖
RUN pnpm install --production

# 开始运行项目
COPY run.sh /run.sh
RUN chmod +x /run.sh

# 设置映射
VOLUME /home/nginx/html/json:/app/utils
VOLUME /home/nginx/html/log:/app/logs

# 执行项目运行命令
CMD ["pnpm", "build"]