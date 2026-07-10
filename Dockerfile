# Paso 1: Compilar la aplicación Angular
FROM node:20-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Compilar el proyecto en modo producción
RUN npm run build -- --configuration production

# Paso 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Copiar los archivos compilados desde el paso anterior a Nginx
# Cloud Run necesita que apuntemos exactamente a la ruta de salida
COPY --from=build /app/dist/Crud_Angular/browser /usr/share/nginx/html

# Configuración de Nginx adaptada para el puerto 8080 de Cloud Run y rutas de Angular (SPA)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponer el puerto requerido por Google Cloud Run
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
