FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# Backend production image
FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist/server.cjs ./dist/server.cjs
EXPOSE 3000
CMD ["node", "dist/server.cjs"]


# Frontend production image
FROM nginx:alpine AS frontend
COPY --from=build /app/dist/ /usr/share/nginx/html/
# The backend bundle must never be publicly served.
RUN rm -f /usr/share/nginx/html/server.cjs /usr/share/nginx/html/server.cjs.map
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80