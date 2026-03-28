FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY . .

# EXPOSE port 3001 (sesuai setting server.js kita)
EXPOSE 3001

# Jalankan server
CMD ["node", "server.js"]
