# Imagen base con Node.js LTS
FROM node:20-bullseye

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git curl wget python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar Expo CLI globalmente
RUN npm install -g expo-cli

# Crear directorio de trabajo
WORKDIR /workspace

# Copiar archivos del proyecto
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Exponer puertos que usa Expo
EXPOSE 19000 19001 19002

# Comando por defecto
CMD ["npm", "start"]
