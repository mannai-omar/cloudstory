# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
# Use the lockfile when it exists (commit it after your first `npm install`).
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
ARG VITE_GITHUB_URL=https://github.com/
ENV VITE_GITHUB_URL=${VITE_GITHUB_URL}
RUN npm run build

# ---- Runtime stage: static files served by unprivileged nginx on :8080 ----
FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG APP_VERSION=dev
ARG GIT_COMMIT=unknown
LABEL org.opencontainers.image.title="cloudstory-web" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

# Where /api is forwarded. In Kubernetes, point it at the API Service (or route /api at the ingress instead).
ENV API_UPSTREAM=http://api:8080

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
