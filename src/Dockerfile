# Usa una base leggera Node.js
FROM node:18-alpine
# Imposta la working directory
WORKDIR /app

# Copia i file package e installa le dipendenze
COPY package*.json ./
RUN npm install --only=production

# Copia il resto del codice
COPY . .

# Espone la porta 3000
EXPOSE 3000

# Avvia l’app
CMD ["npm", "start"]