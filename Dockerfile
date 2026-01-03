FROM node:20-bullseye

# Install system dependencies
RUN apt update && apt install -y ffmpeg python3-pip
RUN pip3 install -U yt-dlp
RUN npm install -g npm@11.7.0

WORKDIR /app

# Copy package.json + placeholder package-lock.json
COPY package.json package-lock.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Start server
CMD ["node", "server.js"]
