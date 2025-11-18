# Sử dụng node 20 để build ứng dụng Vite
FROM node:20 AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file package.json và package-lock.json, sau đó cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Build ứng dụng Vite (sẽ tạo ra folder dist)
RUN npm run build

# ------------------------------
# Sử dụng Nginx để phục vụ ứng dụng đã build
FROM nginx:latest

# Xóa cấu hình mặc định và copy file cấu hình Nginx mới
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf


# Copy các file build được từ stage builder vào thư mục phục vụ của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở port 80 cho Nginx
EXPOSE 80

# Chạy Nginx ở chế độ nền
CMD ["nginx", "-g", "daemon off;"]