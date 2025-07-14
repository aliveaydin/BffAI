# Build stage
FROM node:20 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .


# Production stage
FROM node:20-alpine as production
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["npm", "run", "start-prod"]
