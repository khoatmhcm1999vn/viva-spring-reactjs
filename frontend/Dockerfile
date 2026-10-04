# ============================================================================
# Giai doan 1: build static
# ============================================================================
FROM node:16-bullseye-slim AS build

WORKDIR /app

# Copy rieng manifest truoc de layer npm install duoc cache: sua code trong src
# khong keo theo viec cai lai gan 1100 package.
COPY package.json ./

# Phai dung --force, khong dung --legacy-peer-deps. Co --legacy-peer-deps bo qua hoan
# toan viec giai peer dependency va de lai ajv voi ajv-keywords lech major, lam
# webpack chet voi "Cannot find module 'ajv/dist/compile/codegen'".
# Khoi overrides trong package.json ghim react-konva ve ban tuong thich React 17.
RUN npm install --force

COPY . .

# Frontend goi duong dan TUONG DOI, de nginx quyet dinh backend nam o dau.
# Nho vay mot image dung duoc cho moi moi truong, khong phai build lai khi doi domain
# (gia tri REACT_APP_* bi nhung cung vao bundle luc build, khong doc duoc luc chay).
#   /api -> axios baseURL thanh /api/v1, khop voi Constants.API_V1 ben backend
#   /ws  -> SockJS nhan duong dan tuong doi va tu ghep voi origin cua trang
ENV REACT_APP_API_URL=/api
ENV REACT_APP_SOCKET_URL=/ws

# Goi react-scripts truc tiep thay vi "npm run build:prod": script do dung env-cmd de
# nap .env.production, ma file do dang tro vao mot domain da chet. O day ta muon dung
# hai bien o tren.
RUN npx react-scripts build


# ============================================================================
# Giai doan 2: phuc vu static
# ============================================================================
FROM nginx:1.27-alpine

# Image nginx chinh thuc chay envsubst tren moi file trong /etc/nginx/templates
# luc khoi dong, roi ghi ket qua ra /etc/nginx/conf.d. Nho vay doi backend chi can
# doi bien moi truong, khong phai build lai image.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/build /usr/share/nginx/html

# Mac dinh tro vao service "backend" trong docker compose. Chay thu o may thi ghi de,
# vi du: -e BACKEND_ORIGIN=host.docker.internal:8090
ENV BACKEND_ORIGIN=backend:8080

EXPOSE 80
