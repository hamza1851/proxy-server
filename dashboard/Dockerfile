# -------------------------------------------------------------
# STAGE 1: Build React TypeScript Frontend
# -------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# STAGE 2: Build Express TypeScript Backend
# -------------------------------------------------------------
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# -------------------------------------------------------------
# STAGE 3: Production Runner
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy compiled backend dist and initial data
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/data ./data

# Copy built frontend dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000

CMD ["node", "dist/server.js"]
