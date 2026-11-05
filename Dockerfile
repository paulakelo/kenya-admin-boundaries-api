# ==========================================
# Stage 1: Build the React 19 Frontend SPA
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Compile the Go 1.25 REST Engine
# ==========================================
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY backend/ ./backend/
COPY internal/ ./internal/
COPY pkg/ ./pkg/

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/api ./backend/cmd/api

# ==========================================
# Stage 3: Minimal Self-Contained Runtime
# ==========================================
FROM alpine:3.20 AS runtime
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Copy compiled static Go binary
COPY --from=backend-builder /bin/api /usr/local/bin/api

# Copy static frontend bundle
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PORT=8080
ENV STATIC_DIR=/app/frontend/dist
ENV ENVIRONMENT=production

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/api"]
