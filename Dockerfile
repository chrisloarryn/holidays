# Paso 1: Definir la imagen base con Node.js versión 21
FROM node:21-alpine

# Paso 2: Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Paso 3: Copiar los archivos de definición del proyecto
COPY package.json yarn.lock ./

# Paso 4: Instalar las dependencias del proyecto usando yarn
RUN yarn install --frozen-lockfile

# Paso 5: Copiar los archivos fuente del proyecto al contenedor
COPY . .

# Paso 6: Compilar la aplicación (asegúrate de que tu proyecto tenga un script de build)
RUN yarn build

# Paso 7: Exponer el puerto que utiliza tu aplicación (puede variar según tu configuración)
EXPOSE 3000

# Paso 8: Definir el comando para ejecutar la aplicación
CMD ["node", "dist/main"]
