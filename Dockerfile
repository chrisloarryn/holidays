# Paso 1: Definir la imagen base
FROM node:14-alpine

# Paso 2: Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Paso 3: Copiar los archivos de definición del proyecto
COPY package*.json ./

# Paso 4: Instalar las dependencias del proyecto
RUN npm install

# Paso 5: Copiar los archivos fuente del proyecto al contenedor
COPY . .

# Paso 6: Compilar la aplicación
RUN npm run build

# Paso 7: Exponer el puerto que utiliza tu aplicación
EXPOSE 3000

# Paso 8: Definir el comando para ejecutar la aplicación
CMD ["node", "dist/main"]
