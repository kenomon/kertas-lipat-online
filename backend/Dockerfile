FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY . .

# Set PORT environment variable
ENV PORT=7860

# EXPOSE port 7860
EXPOSE 7860

# Jalankan server
CMD ["node", "server.js"]
