FROM node:22-alpine

WORKDIR /app

# Copy server and assets
COPY server.js ./
COPY public/ ./public/

ENV PORT=8000
EXPOSE 8000

CMD ["node", "server.js"]
