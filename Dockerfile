FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_PATIENT_API_URL
ARG VITE_COMMS_API_URL
ARG VITE_COMMS_OPERATOR_SECRET
ENV VITE_PATIENT_API_URL=$VITE_PATIENT_API_URL
ENV VITE_COMMS_API_URL=$VITE_COMMS_API_URL
ENV VITE_COMMS_OPERATOR_SECRET=$VITE_COMMS_OPERATOR_SECRET

RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["/bin/sh", "-c", "sed -i \"s/PORT_PLACEHOLDER/${PORT:-8080}/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
